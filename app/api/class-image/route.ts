import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const relPath = searchParams.get("path");

  if (!relPath || !relPath.startsWith("/uploads/")) {
    return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", relPath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const fileStream = fs.createReadStream(filePath);

  const ext = path.extname(filePath).toLowerCase();
  let contentType = "image/jpeg";
  if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".gif") contentType = "image/gif";

  return new NextResponse(fileStream as any, {
    status: 200,
    headers: {
      "Content-Type": contentType,
    },
  });
}
