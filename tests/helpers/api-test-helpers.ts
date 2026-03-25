import { NextRequest } from "next/server";

export function createPostRequest(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export function createGetRequest(
  url: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: "GET",
    headers: {
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
  });
}

export async function parseResponse(response: Response) {
  const data = await response.json();
  return { status: response.status, data };
}
