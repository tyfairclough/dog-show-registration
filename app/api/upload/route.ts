import { NextRequest, NextResponse } from 'next/server';
import { processImage } from '@/lib/image';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

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
          hypothesisId: 'H3',
          location: 'app/api/upload/route.ts:POST:start',
          message: 'Upload POST received',
          data: {
            hasFile: !!file,
            fileName: file?.name,
            fileType: file?.type,
            fileSize: file?.size,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {
      // ignore logging errors
    }
    // #endregion

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process the image and create all crops
    const imagePaths = await processImage(buffer, file.name);

    return NextResponse.json({
      success: true,
      images: imagePaths,
    });
  } catch (error) {
    console.error('Upload error:', error);

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
          hypothesisId: 'H4',
          location: 'app/api/upload/route.ts:POST:error',
          message: 'Upload POST error',
          data: {
            error: (error as Error)?.message ?? 'unknown',
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {
      // ignore logging errors
    }
    // #endregion

    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
