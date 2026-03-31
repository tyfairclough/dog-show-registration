import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const relPath = searchParams.get('path');

  // #region agent log
  try {
    fetch('http://127.0.0.1:7242/ingest/5b21ff9a-408f-493c-b269-17392d0670a5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '31ef0b',
      },
      body: JSON.stringify({
        sessionId: '31ef0b',
        runId: 'pre-fix',
        hypothesisId: 'H6',
        location: 'app/api/class-image/route.ts:GET:start',
        message: 'class-image GET called',
        data: { relPath },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch {
    // ignore logging errors
  }
  // #endregion

  if (!relPath || !relPath.startsWith('/uploads/')) {
    return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'public', relPath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  const fileStream = fs.createReadStream(filePath);

  // Very simple content type detection based on extension
  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.gif') contentType = 'image/gif';

  return new NextResponse(fileStream as any, {
    status: 200,
    headers: {
      'Content-Type': contentType,
    },
  });
}

