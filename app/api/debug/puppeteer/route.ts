import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { appendFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEBUG_LOG_PATH = join(process.cwd(), 'debug-5336cf.log');

function writeDebugLog(payload: Record<string, unknown>) {
  const line = JSON.stringify(payload) + '\n';
  try {
    appendFileSync(DEBUG_LOG_PATH, line);
  } catch {
    // ignore logging failures
  }
}

export async function GET() {
  try {
    const path = puppeteer.executablePath();

    // #region agent log
    writeDebugLog({
      sessionId: '5336cf',
      runId: 'pre-fix',
      hypothesisId: 'H-exec',
      location: 'app/api/debug/puppeteer/route.ts:27',
      message: 'puppeteer.executablePath() queried',
      data: { path },
      timestamp: Date.now(),
    });
    // #endregion

    return NextResponse.json({ executablePath: path }, { status: 200 });
  } catch (e: any) {
    // #region agent log
    writeDebugLog({
      sessionId: '5336cf',
      runId: 'pre-fix',
      hypothesisId: 'H-exec-error',
      location: 'app/api/debug/puppeteer/route.ts:40',
      message: 'puppeteer.executablePath() failed',
      data: { name: e?.name, message: e?.message },
      timestamp: Date.now(),
    });
    // #endregion

    return NextResponse.json(
      {
        errorName: e?.name ?? 'Error',
        errorMessage: e?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}

