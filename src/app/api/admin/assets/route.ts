import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { apiError } from "@/lib/api-response";
import { requireCsrf, requireSession, requireWritableSession } from "@/lib/auth";
import { archiveAsset, insertAsset, listAssets, uploadRoot } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 10 * 1024 * 1024;

function publicAsset(asset: ReturnType<typeof listAssets>[number]) {
  const { filePath: _filePath, thumbPath: _thumbPath, url: _url, archived: _archived, ...safe } = asset;
  return safe;
}

export async function GET(request: NextRequest) {
  try { requireSession(request); return NextResponse.json({ assets: listAssets().map(publicAsset) }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireWritableSession(request); requireCsrf(request);
    const form = await request.formData();
    const file = form.get("file");
    const kind = form.get("kind") === "product-icon" ? "product-icon" : "logo";
    const name = String(form.get("name") || "Uploaded asset").trim().slice(0, 120);
    if (!(file instanceof File)) throw new Error("An image file is required");
    if (!['image/png', 'image/webp'].includes(file.type)) throw new Error("Only PNG and WebP images are allowed");
    if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("Image must be between 1 byte and 10 MB");
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer, { failOn: "warning", limitInputPixels: 4096 * 4096 }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width < 128 || metadata.height < 128 || metadata.width > 4096 || metadata.height > 4096) throw new Error("Image dimensions must be between 128 and 4096 pixels");
    const id = `asset-${randomUUID()}`;
    const extension = file.type === "image/webp" ? "webp" : "png";
    const originalPath = path.join(uploadRoot, `${id}.${extension}`);
    const thumbPath = path.join(uploadRoot, `${id}-thumb.webp`);
    if (extension === "webp") await image.clone().webp({ quality: 92 }).toFile(originalPath);
    else await image.clone().png({ compressionLevel: 9 }).toFile(originalPath);
    await image.clone().resize(256, 256, { fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toFile(thumbPath);
    const asset = insertAsset({ id, name: name || "Uploaded asset", kind, filePath: originalPath, thumbPath, mime: file.type, width: metadata.width, height: metadata.height });
    return NextResponse.json({ asset: publicAsset(asset) }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    requireWritableSession(request); requireCsrf(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) throw new Error("Asset id is required");
    archiveAsset(id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
