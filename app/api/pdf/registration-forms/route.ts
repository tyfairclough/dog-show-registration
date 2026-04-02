import { NextRequest, NextResponse } from 'next/server';
import {
  classOperations,
  dogOperations,
  ownerOperations,
  registrationOperations,
} from '@/lib/db';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth';
import {
  buildRegistrationFormsHtml,
  type RegistrationFormClassRow,
  type RegistrationFormPageInput,
} from '@/lib/pdf/registrationFormHtml';
import { renderHtmlToPdf } from '@/lib/pdf/renderPdf';
import { appendFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEBUG_LOG_PATH = join(process.cwd(), 'debug-19f0a7.log');

function writeDebugLog(payload: Record<string, unknown>) {
  const line = JSON.stringify(payload) + '\n';
  try {
    appendFileSync(DEBUG_LOG_PATH, line);
  } catch {
    // ignore logging failures
  }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5b21ff9a-408f-493c-b269-17392d0670a5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '19f0a7',
    },
    body: JSON.stringify({
      sessionId: '19f0a7',
      ...payload,
    }),
  }).catch(() => {});
  // #endregion
}

async function sortedClassRows(): Promise<RegistrationFormClassRow[]> {
  const classes = await classOperations.getAll();
  return classes
    .map((c) => ({ id: c.id, name: c.name, fee: Number(c.fee) }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

async function activeClassIdsForDog(dogId: string): Promise<Set<string>> {
  const regs = await registrationOperations.getByDogId(dogId);
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

async function pageForDog(
  owner: { name: string; email: string },
  dog: {
    id: string;
    name: string;
    breed: string | null;
    age: number | null;
    sex: string | null;
    is_rescue: number;
  },
  classRows: RegistrationFormClassRow[],
  isBlank: boolean
): Promise<RegistrationFormPageInput> {
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
    selectedClassIds: await activeClassIdsForDog(dog.id),
    isBlank,
  };
}

function blankPage(classRows: RegistrationFormClassRow[]): RegistrationFormPageInput {
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
    const classRows = await sortedClassRows();

    // #region agent log
    writeDebugLog({
      runId: 'pre-fix',
      hypothesisId: 'H0',
      location: 'app/api/pdf/registration-forms/route.ts:104',
      message: 'GET /api/pdf/registration-forms entry',
      data: {
        mode,
        hasOwnerId: Boolean(ownerIdParam),
        hasOwnerEmail: Boolean(ownerEmailParam),
        hasToken: Boolean(tokenParam),
        hasDogId: Boolean(dogIdParam),
        admin,
      },
      timestamp: Date.now(),
    });
    // #endregion

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
        pages.push(await pageForDog(owner, dog, classRows, false));
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
      let owner = null;
      if (ownerIdParam) {
        owner = await ownerOperations.getById(ownerIdParam);
      } else if (ownerEmailParam) {
        owner = await ownerOperations.getByEmail(ownerEmailParam.trim().toLowerCase());
      }
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
      }
      const dogs = await dogOperations.getByOwnerId(owner.id);
      dogs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      const pages = await Promise.all(
        dogs.map((dog) => pageForDog(owner, dog, classRows, false))
      );
      if (pages.length === 0) {
        const html = buildRegistrationFormsHtml([blankPage(classRows)]);
        pdfBuffer = await renderHtmlToPdf(html);
      } else {
        const html = buildRegistrationFormsHtml(pages);
        pdfBuffer = await renderHtmlToPdf(html);
      }
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
        const html = buildRegistrationFormsHtml([await pageForDog(owner, dog, classRows, false)]);
        pdfBuffer = await renderHtmlToPdf(html);
        filename = `registration-${asciiFilenameBase(dog.name)}.pdf`;
      } else if (tokenParam) {
        const tokenOwner = await ownerOperations.getByToken(tokenParam);
        if (!tokenOwner || tokenOwner.id !== owner.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const html = buildRegistrationFormsHtml([await pageForDog(owner, dog, classRows, false)]);
        pdfBuffer = await renderHtmlToPdf(html);
        filename = `registration-${asciiFilenameBase(dog.name)}.pdf`;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (tokenParam) {
      const owner = await ownerOperations.getByToken(tokenParam);
      if (!owner) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      const dogs = await dogOperations.getByOwnerId(owner.id);
      dogs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      const pages = await Promise.all(
        dogs.map((dog) => pageForDog(owner, dog, classRows, false))
      );
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

    // #region agent log
    writeDebugLog({
      runId: 'pre-fix',
      hypothesisId: 'H5',
      location: 'app/api/pdf/registration-forms/route.ts:222',
      message: 'GET /api/pdf/registration-forms threw error',
      data: {
        errorName: (e as any)?.name,
        errorMessage: (e as any)?.message,
        errorStack: (e as any)?.stack,
      },
      timestamp: Date.now(),
    });
    // #endregion

    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
