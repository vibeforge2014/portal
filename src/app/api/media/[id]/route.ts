import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getAsset } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const mime = asset.mime || (asset.url?.endsWith(".webp") ? "image/webp" : "image/png");
  if (!filePath || !mime) return new NextResponse("Not found", { status: 404 });
  try {
    const body = await fs.readFile(filePath);
    return new NextResponse(body, { headers: { "content-type": mime, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
  } catch { return new NextResponse("Not found", { status: 404 }); }
}
