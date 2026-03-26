import { describe, it, expect } from "vitest";

import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  UnauthorizedError,
  ForbiddenError,
  isOperationalError,
  formatErrorForClient,
} from "./errors";

describe("AppError", () => {
  it("creates error with message, code, and status", () => {
    const error = new AppError("test error", "TEST_ERROR", 400);
    expect(error.message).toBe("test error");
    expect(error.code).toBe("TEST_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it("defaults to status 500", () => {
    const error = new AppError("test", "TEST");
    expect(error.statusCode).toBe(500);
  });

  it("is an instance of Error", () => {
    const error = new AppError("test", "TEST");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("ValidationError", () => {
  it("creates with 400 status", () => {
    const error = new ValidationError("invalid field");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("includes field name", () => {
    const error = new ValidationError("invalid email", "email");
    expect(error.field).toBe("email");
  });
});

describe("NotFoundError", () => {
  it("creates 404 with resource name", () => {
    const error = new NotFoundError("Producto");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Producto no encontrado");
  });
});

describe("ConflictError", () => {
  it("creates 409", () => {
    const error = new ConflictError("duplicate");
    expect(error.statusCode).toBe(409);
  });
});

describe("RateLimitError", () => {
  it("creates 429", () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
  });

  it("is not operational", () => {
    const error = new RateLimitError();
    expect(error.isOperational).toBe(false);
  });
});

describe("UnauthorizedError", () => {
  it("creates 401 with default message", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("No autorizado");
  });
});

describe("ForbiddenError", () => {
  it("creates 403 with default message", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe("Acceso denegado");
  });
});

describe("isOperationalError", () => {
  it("returns true for operational AppError", () => {
    expect(isOperationalError(new ValidationError("test"))).toBe(true);
  });

  it("returns false for non-operational errors", () => {
    expect(isOperationalError(new RateLimitError())).toBe(false);
  });

  it("returns false for regular Error", () => {
    expect(isOperationalError(new Error("test"))).toBe(false);
  });
});

describe("formatErrorForClient", () => {
  it("formats AppError for client", () => {
    const result = formatErrorForClient(new ValidationError("invalid email"));
    expect(result.error).toBe("invalid email");
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("masks non-operational errors", () => {
    const result = formatErrorForClient(new RateLimitError());
    expect(result.error).toBe("Has excedido el límite de requests");
    expect(result.message).toBe("Ha ocurrido un error");
  });

  it("handles regular Error", () => {
    const result = formatErrorForClient(new Error("unexpected"));
    expect(result.error).toBe("Ha ocurrido un error inesperado");
  });

  it("handles non-Error values", () => {
    const result = formatErrorForClient("string error");
    expect(result.error).toBe("Ha ocurrido un error inesperado");
  });
});
