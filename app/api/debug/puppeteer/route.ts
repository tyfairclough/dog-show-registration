import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const path = puppeteer.executablePath();
    return NextResponse.json({ executablePath: path }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        errorName: e?.name ?? "Error",
        errorMessage: e?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
