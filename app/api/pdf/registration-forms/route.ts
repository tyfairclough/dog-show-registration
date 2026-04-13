import { NextRequest, NextResponse } from 'next/server';
import {
  classOperations,
  dogOperations,
  ownerOperations,
} from '@/lib/db';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth';
import {
  buildRegistrationFormsHtml,
  type RegistrationFormPageInput,
} from '@/lib/pdf/registrationFormHtml';
import {
  blankRegistrationFormPage,
  buildRegistrationFormPageForDog,
  getRegistrationFormPagesForOwner,
  getRegistrationFormPagesForToken,
  getSortedRegistrationFormClassRows,
} from '@/lib/pdf/ownerRegistrationFormPages';
import { renderHtmlToPdf } from '@/lib/pdf/renderPdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asciiFilenameBase(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_.]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base || 'registration';
}

async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return session !== null;
}

export async function GET(request: NextRequest) {
  let pdfBuffer: Buffer;
  let filename: string;

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const ownerIdParam = searchParams.get('ownerId');
    const ownerEmailParam = searchParams.get('ownerEmail');
    const tokenParam = searchParams.get('token');
    const dogIdParam = searchParams.get('dogId');

    const admin = await isAdminRequest(request);
    const classRows = await getSortedRegistrationFormClassRows();

    if (mode === 'blank') {
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const html = buildRegistrationFormsHtml([blankRegistrationFormPage(classRows)]);
      pdfBuffer = await renderHtmlToPdf(html);
      filename = 'registration-form-blank.pdf';
    } else if (mode === 'all') {
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const dogs = await dogOperations.getAll();
      const ownerIds = [...new Set(dogs.map((d) => d.owner_id))];
      const ownerList = await Promise.all(ownerIds.map((id) => ownerOperations.getById(id)));
      const ownerById = new Map<
        string,
        NonNullable<Awaited<ReturnType<typeof ownerOperations.getById>>>
      >();
      ownerIds.forEach((id, i) => {
        const o = ownerList[i];
        if (o) ownerById.set(id, o);
      });
      dogs.sort((a, b) => {
        const oa = ownerById.get(a.owner_id);
        const ob = ownerById.get(b.owner_id);
        const ownerCmp = (oa?.name || '').localeCompare(ob?.name || '', undefined, {
          sensitivity: 'base',
        });
        if (ownerCmp !== 0) return ownerCmp;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      const pages: RegistrationFormPageInput[] = [];
      for (const dog of dogs) {
        const owner = ownerById.get(dog.owner_id);
        if (!owner) continue;
        pages.push(await buildRegistrationFormPageForDog(owner, dog, classRows, false));
      }
      if (pages.length === 0) {
        const html = buildRegistrationFormsHtml([blankRegistrationFormPage(classRows)]);
        pdfBuffer = await renderHtmlToPdf(html);
      } else {
        const html = buildRegistrationFormsHtml(pages);
        pdfBuffer = await renderHtmlToPdf(html);
      }
      filename = 'registration-all.pdf';
    } else if (ownerIdParam || ownerEmailParam) {
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      let owner = null;
      if (ownerIdParam) {
        owner = await ownerOperations.getById(ownerIdParam);
      } else if (ownerEmailParam) {
        owner = await ownerOperations.getByEmail(ownerEmailParam.trim().toLowerCase());
      }
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
      }
      const pages = await getRegistrationFormPagesForOwner(owner, classRows);
      const html = buildRegistrationFormsHtml(pages);
      pdfBuffer = await renderHtmlToPdf(html);
      filename = `registration-${asciiFilenameBase(owner.name)}.pdf`;
    } else if (dogIdParam) {
      const dog = await dogOperations.getById(dogIdParam);
      if (!dog) {
        return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
      }
      const owner = await ownerOperations.getById(dog.owner_id);
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
      }

      if (admin) {
        const html = buildRegistrationFormsHtml([
          await buildRegistrationFormPageForDog(owner, dog, classRows, false),
        ]);
        pdfBuffer = await renderHtmlToPdf(html);
        filename = `registration-${asciiFilenameBase(dog.name)}.pdf`;
      } else if (tokenParam) {
        const tokenOwner = await ownerOperations.getByToken(tokenParam);
        if (!tokenOwner || tokenOwner.id !== owner.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const html = buildRegistrationFormsHtml([
          await buildRegistrationFormPageForDog(owner, dog, classRows, false),
        ]);
        pdfBuffer = await renderHtmlToPdf(html);
        filename = `registration-${asciiFilenameBase(dog.name)}.pdf`;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (tokenParam) {
      const pages = await getRegistrationFormPagesForToken(tokenParam);
      if (!pages) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      const html = buildRegistrationFormsHtml(pages);
      pdfBuffer = await renderHtmlToPdf(html);
      filename = 'registration-forms.pdf';
    } else {
      return NextResponse.json(
        { error: 'Missing mode, ownerId, ownerEmail, token, or dogId' },
        { status: 400 }
      );
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('PDF generation failed');

    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
