const MAX_PROXY_BODY_BYTES = 11 * 1024 * 1024;

type Context = { params: Promise<{ path: string[] }> };

export const runtime = "nodejs";

function unavailable() {
  return Response.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

async function proxy(request: Request, context: Context) {
  const origin = process.env.PDF_CONVERTER_ORIGIN?.replace(/\/$/, "");
  if (!origin) return unavailable();
  const { path } = await context.params;
  const source = new URL(request.url);
  const target = new URL(`${origin}/api/pdf-convert/${path.map(encodeURIComponent).join("/")}/${source.search}`);
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_PROXY_BODY_BYTES) return Response.json({ error: { code: "FILE_TOO_LARGE" } }, { status: 413 });

  const headers = new Headers();
  for (const name of ["accept", "content-type", "x-job-token"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let body: ArrayBuffer | undefined;
  if (request.method === "POST") {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_PROXY_BODY_BYTES) return Response.json({ error: { code: "FILE_TOO_LARGE" } }, { status: 413 });
  }

  try {
    const upstream = await fetch(target, { method: request.method, headers, body, cache: "no-store", signal: request.signal });
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "content-length", "content-disposition"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return unavailable();
  }
}

export async function GET(request: Request, context: Context) { return proxy(request, context); }
export async function POST(request: Request, context: Context) { return proxy(request, context); }
export async function DELETE(request: Request, context: Context) { return proxy(request, context); }
