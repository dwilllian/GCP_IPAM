import { FastifyRequest } from "fastify";

export type ErrorCode =
  | "POOL_NOT_FOUND"
  | "INVALID_PREFIX"
  | "NO_AVAILABLE_BLOCK"
  | "CIDR_CONFLICT"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED_WORKER"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export function errorResponse(requestId: string | undefined, error: AppError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    },
    requestId
  };
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  const message = error instanceof Error ? error.message : "Erro interno";
  return new AppError("INTERNAL", 500, message);
}

export function requestIdFrom(request: FastifyRequest): string | undefined {
  return request.id;
}
