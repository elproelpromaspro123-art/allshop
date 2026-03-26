import type { Instrumentation } from "next";
import { logger } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }

  if (process.env.NODE_ENV === "development") {
    await logger.info("Instrumentation registered", {
      runtime: process.env.NEXT_RUNTIME || "unknown",
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const requestError = error as Error & { digest?: string };
  const requestContext = context as {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource?: string;
    renderType?: string;
    revalidateReason?: string;
  };

  await logger.error("Next.js request error", error, {
    digest: requestError.digest,
    path: request.path,
    method: request.method,
    routerKind: requestContext.routerKind,
    routePath: requestContext.routePath,
    routeType: requestContext.routeType,
    renderSource: requestContext.renderSource,
    renderType: requestContext.renderType,
    revalidateReason: requestContext.revalidateReason,
  });
};
