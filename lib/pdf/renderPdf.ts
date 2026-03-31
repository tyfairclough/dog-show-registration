import puppeteer from 'puppeteer';
console.log('PUPPETEER_EXECUTABLE:', puppeteer.executablePath());
import { appendFileSync, existsSync } from 'fs';
import { join } from 'path';

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

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const rawExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  const hasExecutablePathEnv = Boolean(rawExecutablePath);
  const hasValidExecutablePath = hasExecutablePathEnv && rawExecutablePath ? existsSync(rawExecutablePath) : false;
  const executablePath = hasValidExecutablePath ? rawExecutablePath : undefined;

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
