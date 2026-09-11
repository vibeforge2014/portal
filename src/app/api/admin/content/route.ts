import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireCsrf, requireSession, requireWritableSession } from "@/lib/auth";
import { contentStatus, getAsset, getDraftContent, getPreviousContent, getPublishedContent, saveDraft } from "@/lib/db";
import { parseSiteContent } from "@/lib/content-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateAssets(content: ReturnType<typeof parseSiteContent>) {
  for (const id of [content.brand.activeLogoId, ...content.products.map((product) => product.iconAssetId)]) {
    const asset = getAsset(id);
    if (!asset || asset.archived) throw new Error(`Referenced asset is unavailable: ${id}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    requireSession(request);
    const status = contentStatus();
    return NextResponse.json({ draft: getDraftContent(), published: getPublishedContent(), previous: getPreviousContent(), status: { ...status, canRollback: Boolean(status.canRollback) } });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: NextRequest) {
  try {
    requireWritableSession(request);
    requireCsrf(request);
    const content = parseSiteContent(await request.json());
    validateAssets(content);
    return NextResponse.json({ draft: saveDraft(content), status: contentStatus() });
  } catch (error) { return apiError(error); }
}
