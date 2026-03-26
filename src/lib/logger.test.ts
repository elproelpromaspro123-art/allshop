import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("logger", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DISCORD_WEBHOOK_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("emits structured JSON and inherits child context", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { logger } = await import("./logger");
    await logger.child({ requestId: "req-123", route: "/checkout" }).info("Checkout started", {
      cartCount: 2,
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"requestId":"req-123"'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"cartCount":2'),
    );
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("captures error context without throwing", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { logger } = await import("./logger");
    await logger.error("Boom", new Error("Unexpected"), {
      requestId: "req-321",
    });

    expect(logSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
