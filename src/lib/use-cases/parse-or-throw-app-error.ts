import { ZodError } from 'zod';
import { ContentTooLongError, FutureDateError, ValidationError } from '@/types/errors';

const hasFutureDateIssue = (error: ZodError): boolean => {
  return error.issues.some((issue) => issue.message === 'Future date is not allowed');
};

const hasContentTooLongIssue = (error: ZodError): boolean => {
  return error.issues.some((issue) => issue.code === 'too_big' && issue.path.includes('content'));
};

type ParsableSchema<TInput, TOutput> = {
  parse: (input: TInput) => TOutput;
};

export const parseOrThrowAppError = <TInput, TOutput>(
  schema: ParsableSchema<TInput, TOutput>,
  input: TInput,
): TOutput => {
  try {
    return schema.parse(input);
  } catch (error) {
    if (!(error instanceof ZodError)) {
      throw error;
    }

    if (hasFutureDateIssue(error)) {
      throw new FutureDateError(undefined, error);
    }

    if (hasContentTooLongIssue(error)) {
      throw new ContentTooLongError(undefined, error);
    }

    throw new ValidationError('Validation failed', error);
  }
};
