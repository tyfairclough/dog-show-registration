import { NextRequest, NextResponse } from 'next/server';
import { buildRegistrationFormsHtml } from '@/lib/pdf/registrationFormHtml';
import { getRegistrationFormPagesForToken } from '@/lib/pdf/ownerRegistrationFormPages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const autoPrint = searchParams.get('autoPrint') === '1';

    if (!token?.trim()) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const pages = await getRegistrationFormPagesForToken(token.trim());
    if (!pages) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const html = buildRegistrationFormsHtml(pages, { autoPrint });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('Registration forms print HTML failed', e);
    return NextResponse.json({ error: 'Failed to build print view' }, { status: 500 });
  }
}
