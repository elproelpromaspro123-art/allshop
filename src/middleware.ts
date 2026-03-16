import type { NextRequest } from "next/server";
import { proxy, config } from "./proxy";

export { config };

export async function middleware(request: NextRequest) {
  return proxy(request);
}
