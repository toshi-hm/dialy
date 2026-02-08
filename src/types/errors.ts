export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'SAVE_FAILED'
  | 'FUTURE_DATE_NOT_ALLOWED'
  | 'FETCH_FAILED';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super('VALIDATION_ERROR', message, cause);
    this.name = 'ValidationError';
  }
}

export class SaveFailedError extends AppError {
  constructor(message: string, cause?: unknown) {
    super('SAVE_FAILED', message, cause);
    this.name = 'SaveFailedError';
  }
}

export class FutureDateError extends AppError {
  constructor(message: string = 'Future date is not allowed', cause?: unknown) {
    super('FUTURE_DATE_NOT_ALLOWED', message, cause);
    this.name = 'FutureDateError';
  }
}

export class FetchFailedError extends AppError {
  constructor(message: string, cause?: unknown) {
    super('FETCH_FAILED', message, cause);
    this.name = 'FetchFailedError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
