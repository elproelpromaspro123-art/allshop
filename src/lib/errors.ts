/**
 * Error handling utilities for consistent error management across the app
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(_retryAfterSeconds?: number) {
    super("Has excedido el límite de requests", "RATE_LIMIT", 429);
    this.name = "RateLimitError";
    this.statusCode = 429;
    this.isOperational = false;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Acceso denegado") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export function isOperationalError(error: unknown): boolean {
  return error instanceof AppError && error.isOperational;
}

export function formatErrorForClient(error: unknown): {
  error: string;
  code?: string;
  message?: string;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      message: error.isOperational ? error.message : "Ha ocurrido un error",
    };
  }

  return {
    error: "Ha ocurrido un error inesperado",
    message: "Por favor intenta más tarde",
  };
}