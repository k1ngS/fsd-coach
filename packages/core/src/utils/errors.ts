export type ErrorCode =
  | "INVALID_NAME"
  | "INVALID_TEMPLATE"
  | "DIRECTORY_EXISTS"
  | "FILE_EXISTS"
  | "INVALID_SEGMENT"
  | "INVALID_LAYER"
  | "CONFIG_NOT_FOUND"
  | "INVALID_CONFIG";

export class FSDCoachError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "FSDCoachError";
    Error.captureStackTrace(this, this.constructor);
  }

  toString(): string {
    const contextStr = this.context
      ? `\nContext: ${JSON.stringify(this.context, null, 2)}`
      : "";
    return `${this.name} [${this.code}]: ${this.message}${contextStr}`;
  }
}

export function isFSDCoachError(error: unknown): error is FSDCoachError {
  return error instanceof FSDCoachError;
}

export function createError(
  code: ErrorCode,
  message: string,
  context?: Record<string, unknown>
): FSDCoachError {
  return new FSDCoachError(message, code, context);
}
