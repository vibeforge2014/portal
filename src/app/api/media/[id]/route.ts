import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { getAsset } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMMUTABLE_HEADERS = {
  "cache-control": "public, max-age=31536000, immutable",
  "x-content-type-options": "nosniff",
} as const;

const RESIZABLE = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const asset = getAsset(id);
  if (!asset || asset.archived) return new NextResponse("Not found", { status: 404 });
  if (asset.builtin) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4f8cff"/><stop offset="1" stop-color="#9b4fd8"/></linearGradient></defs><rect x="22" y="4" width="20" height="20" rx="6" transform="rotate(45 32 14)" fill="url(#g)"/><rect x="6" y="20" width="20" height="20" rx="6" transform="rotate(45 16 30)" fill="url(#g)"/><rect x="38" y="20" width="20" height="20" rx="6" transform="rotate(45 48 30)" fill="url(#g)"/><rect x="22" y="36" width="20" height="20" rx="6" transform="rotate(45 32 46)" fill="url(#g)"/></svg>`;
    return new NextResponse(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
  }
  const presetPath = asset.url ? path.resolve(process.cwd(), "public", asset.url.replace(/^\/+/, "")) : null;
  const publicRoot = path.resolve(process.cwd(), "public") + path.sep;
  const filePath = presetPath && presetPath.startsWith(publicRoot) ? presetPath : asset.filePath;
  const mime = asset.mime
    || (asset.url?.endsWith(".svg") ? "image/svg+xml" : asset.url?.endsWith(".webp") ? "image/webp" : "image/png");
  if (!filePath || !mime) return new NextResponse("Not found", { status: 404 });

  // ?w= 缩略图变体：源图多为 1024×1024 的上传原图，页面里只显示 27–72px，
  // 按需缩放转 WebP 后走同一 immutable 缓存（变体 URL 不同，边缘各自缓存）。
  const width = Number(request.nextUrl.searchParams.get("w") ?? Number.NaN);
  if (Number.isInteger(width) && width >= 16 && width <= 2048 && RESIZABLE.has(mime)) {
    try {
      const source = await fs.readFile(filePath);
      const variant = await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      return new NextResponse(variant, { headers: { ...IMMUTABLE_HEADERS, "content-type": "image/webp" } });
    } catch {
      // sharp 失败（坏图/内存紧张）时回落到原图
    }
  }

  try {
    const body = await fs.readFile(filePath);
    return new NextResponse(body, { headers: { ...IMMUTABLE_HEADERS, "content-type": mime } });
  } catch { return new NextResponse("Not found", { status: 404 }); }
}
