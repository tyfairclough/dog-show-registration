import puppeteer from 'puppeteer';
import { existsSync } from 'fs';
import { join } from 'path';

// #region agent log
function writeAgentDebugLog(payload: Record<string, unknown>) {
  fetch('http://127.0.0.1:7242/ingest/5b21ff9a-408f-493c-b269-17392d0670a5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'dbff01',
    },
    body: JSON.stringify({
      sessionId: 'dbff01',
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
}
// #endregion

async function start() {
  console.log('PUPPETEER_EXECUTABLE:', puppeteer.executablePath());
  // start your app here (listen(), etc.)
}

start().catch(console.error);

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const rawExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  const hasExecutablePathEnv = Boolean(rawExecutablePath);
  const hasValidExecutablePath = hasExecutablePathEnv && rawExecutablePath ? existsSync(rawExecutablePath) : false;
  const executablePath = hasValidExecutablePath ? rawExecutablePath : undefined;

  // #region agent log
  writeAgentDebugLog({
    runId: 'pre-fix',
    hypothesisId: 'H-stdin-1',
    location: 'lib/pdf/renderPdf.ts:40',
    message: 'renderHtmlToPdf entry (Hostinger stdin investigation)',
    data: {
      hasExecutablePathEnv,
      hasValidExecutablePath,
      effectiveExecutablePath: executablePath || null,
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
  // #endregion

  // #region agent log
  writeDebugLog({
    runId: 'pre-fix',
    hypothesisId: 'H1',
    location: 'lib/pdf/renderPdf.ts:25',
    message: 'renderHtmlToPdf called',
    data: {
      hasExecutablePathEnv,
      hasValidExecutablePath,
      effectiveExecutablePath: executablePath || null,
    },
    timestamp: Date.now(),
  });
  // #endregion

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    // #region agent log
    writeDebugLog({
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'lib/pdf/renderPdf.ts:47',
      message: 'Puppeteer launched successfully',
      data: { executablePath: executablePath || null },
      timestamp: Date.now(),
    });
    // #endregion

    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });

    // #region agent log
    writeDebugLog({
      runId: 'pre-fix',
      hypothesisId: 'H3',
      location: 'lib/pdf/renderPdf.ts:63',
      message: 'PDF generated successfully',
      data: { pdfLength: (pdf as any)?.length ?? null },
      timestamp: Date.now(),
    });
    // #endregion

    return Buffer.from(pdf);
  } catch (error: any) {
    // #region agent log
    writeDebugLog({
      runId: 'pre-fix',
      hypothesisId: 'H4',
      location: 'lib/pdf/renderPdf.ts:77',
      message: 'renderHtmlToPdf failed',
      data: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        nodeVersion: process.version,
        platform: process.platform,
      },
      timestamp: Date.now(),
    });
    // #endregion

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
