import { NextResponse } from "next/server";

interface ApiResponseOptions {
  status?: number;
  headers?: HeadersInit;
  code?: string;
  retryAfterSeconds?: number | null;
  fields?: Record<string, unknown>;
}

function mergeHeaders(
  baseHeaders: HeadersInit | undefined,
  extraHeaders?: HeadersInit,
): Headers {
  const headers = new Headers(baseHeaders);

  if (!extraHeaders) return headers;

  for (const [key, value] of new Headers(extraHeaders).entries()) {
    headers.set(key, value);
  }

  return headers;
}

export function noStoreHeaders(extraHeaders?: HeadersInit): Headers {
  return mergeHeaders(
    {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
    extraHeaders,
  );
}

export function apiOk<T>(
  data: T,
  options: ApiResponseOptions = {},
): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    {
      status: options.status || 200,
      headers: options.headers,
    },
  );
}

export function apiOkFields<T extends object>(
  fields: T,
  options: ApiResponseOptions = {},
): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      ...fields,
    },
    {
      status: options.status || 200,
      headers: options.headers,
    },
  );
}

export function apiError(
  error: string,
  options: ApiResponseOptions & { status: number },
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error,
      code: options.code,
      retryAfterSeconds: options.retryAfterSeconds ?? undefined,
      ...(options.fields || {}),
    },
    {
      status: options.status,
      headers: options.headers,
    },
  );
}
