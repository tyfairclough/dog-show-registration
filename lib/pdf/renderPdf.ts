import puppeteer from "puppeteer";
import { existsSync } from "fs";

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const rawExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  const hasExecutablePathEnv = Boolean(rawExecutablePath);
  const hasValidExecutablePath =
    hasExecutablePathEnv && rawExecutablePath
      ? existsSync(rawExecutablePath)
      : false;
  const executablePath = hasValidExecutablePath ? rawExecutablePath : undefined;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    return Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
