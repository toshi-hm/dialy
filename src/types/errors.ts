export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'SAVE_FAILED'
  | 'FUTURE_DATE_NOT_ALLOWED'
  | 'FETCH_FAILED'
  | 'CONTENT_TOO_LONG'
  | 'LOAD_FAILED'
  | 'DUPLICATE_DATE_ENTRY';

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

export class ContentTooLongError extends AppError {
  constructor(message: string = 'Content exceeds maximum length', cause?: unknown) {
    super('CONTENT_TOO_LONG', message, cause);
    this.name = 'ContentTooLongError';
  }
}

export class LoadFailedError extends AppError {
  constructor(message: string = 'Failed to load diary entries', cause?: unknown) {
    super('LOAD_FAILED', message, cause);
    this.name = 'LoadFailedError';
  }
}

export class DuplicateDateEntryError extends AppError {
  constructor(message: string = 'An entry for this date already exists', cause?: unknown) {
    super('DUPLICATE_DATE_ENTRY', message, cause);
    this.name = 'DuplicateDateEntryError';
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};
