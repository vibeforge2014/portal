import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError } from "@/lib/api-response";
import { requireCsrf, requireWritableSession } from "@/lib/auth";
import { contentStatus, publishDraft } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    requireWritableSession(request); requireCsrf(request);
    const published = publishDraft();
    revalidatePath("/");
    return NextResponse.json({ published, status: contentStatus() });
  } catch (error) { return apiError(error); }
}
