import { NextRequest, NextResponse } from 'next/server';
import {
  classOperations,
  dogOperations,
  ownerOperations,
  registrationOperations,
} from '@/lib/db';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth';
import { buildRegistrationFormsHtml, RegistrationFormPageInput } from '@/lib/pdf/registrationFormHtml';
import { renderHtmlToPdf } from '@/lib/pdf/renderPdf';
import type { Dog, DogClass, Owner } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sortedClassRows() {
  const classes = classOperations.getAll() as DogClass[];
  return classes
    .map((c) => ({ id: c.id, name: c.name, fee: c.fee }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

function activeClassIdsForDog(dogId: string): Set<string> {
  const regs = registrationOperations.getByDogId(dogId) as { class_id: string; status: string }[];
  return new Set(regs.filter((r) => r.status !== 'cancelled').map((r) => r.class_id));
}

function asciiFilenameBase(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_.]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base || 'registration';
}

function pageForDog(
  owner: Owner,
  dog: Dog,
  classRows: ReturnType<typeof sortedClassRows>,
  isBlank: boolean
): RegistrationFormPageInput {
  return {
    owner: { name: owner.name, email: owner.email },
    dog: {
      name: dog.name,
      breed: dog.breed,
      age: dog.age,
      sex: dog.sex,
      is_rescue: dog.is_rescue,
    },
    classes: classRows,
    selectedClassIds: activeClassIdsForDog(dog.id),
    isBlank,
  };
}

function blankPage(classRows: ReturnType<typeof sortedClassRows>): RegistrationFormPageInput {
  return {
    owner: null,
    dog: null,
    classes: classRows,
    selectedClassIds: new Set(),
    isBlank: true,
  };
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
    const classRows = sortedClassRows();

    if (mode === 'blank') {
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const html = buildRegistrationFormsHtml([blankPage(classRows)]);
      pdfBuffer = await renderHtmlToPdf(html);
      filename = 'registration-form-blank.pdf';
    } else if (mode === 'all') {
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const dogs = dogOperations.getAll() as Dog[];
      dogs.sort((a, b) => {
        const oa = ownerOperations.getById(a.owner_id) as Owner | undefined;
        const ob = ownerOperations.getById(b.owner_id) as Owner | undefined;
        const ownerCmp = (oa?.name || '').localeCompare(ob?.name || '', undefined, {
          sensitivity: 'base',
        });
        if (ownerCmp !== 0) return ownerCmp;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      const pages: RegistrationFormPageInput[] = [];
      for (const dog of dogs) {
        const owner = ownerOperations.getById(dog.owner_id) as Owner | undefined;
        if (!owner) continue;
        pages.push(pageForDog(owner, dog, classRows, false));
      }
      if (pages.length === 0) {
        const html = buildRegistrationFormsHtml([blankPage(classRows)]);
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
      let owner: Owner | undefined;
      if (ownerIdParam) {
        owner = ownerOperations.getById(ownerIdParam) as Owner | undefined;
      } else if (ownerEmailParam) {
        owner = ownerOperations.getByEmail(ownerEmailParam.trim().toLowerCase()) as Owner | undefined;
      }
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
      }
      const dogs = dogOperations.getByOwnerId(owner.id) as Dog[];
      dogs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      const pages = dogs.map((dog) => pageForDog(owner!, dog, classRows, false));
      if (pages.length === 0) {
        const html = buildRegistrationFormsHtml([blankPage(classRows)]);
        pdfBuffer = await renderHtmlToPdf(html);
      } else {
        const html = buildRegistrationFormsHtml(pages);
        pdfBuffer = await renderHtmlToPdf(html);
      }
      filename = `registration-${asciiFilenameBase(owner.name)}.pdf`;
    } else if (dogIdParam) {
      const dog = dogOperations.getById(dogIdParam) as Dog | undefined;
      if (!dog) {
        return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
      }
      const owner = ownerOperations.getById(dog.owner_id) as Owner | undefined;
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
      }

      if (admin) {
        const html = buildRegistrationFormsHtml([pageForDog(owner, dog, classRows, false)]);
        pdfBuffer = await renderHtmlToPdf(html);
        filename = `registration-${asciiFilenameBase(dog.name)}.pdf`;
      } else if (tokenParam) {
        const tokenOwner = ownerOperations.getByToken(tokenParam) as Owner | undefined;
        if (!tokenOwner || tokenOwner.id !== owner.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const html = buildRegistrationFormsHtml([pageForDog(owner, dog, classRows, false)]);
        pdfBuffer = await renderHtmlToPdf(html);
        filename = `registration-${asciiFilenameBase(dog.name)}.pdf`;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (tokenParam) {
      const owner = ownerOperations.getByToken(tokenParam) as Owner | undefined;
      if (!owner) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      const dogs = dogOperations.getByOwnerId(owner.id) as Dog[];
      dogs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      const pages = dogs.map((dog) => pageForDog(owner, dog, classRows, false));
      if (pages.length === 0) {
        const html = buildRegistrationFormsHtml([blankPage(classRows)]);
        pdfBuffer = await renderHtmlToPdf(html);
      } else {
        const html = buildRegistrationFormsHtml(pages);
        pdfBuffer = await renderHtmlToPdf(html);
      }
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
