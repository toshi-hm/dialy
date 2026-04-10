/**
 * Server Action のエラーコードをドメインエラーに変換するユーティリティ。
 * 複数のページ/コンポーネントで共通利用できるよう src/app/actions/ に配置。
 */

import {
  ContentTooLongError,
  DuplicateDateEntryError,
  FutureDateError,
  SaveFailedError,
  ValidationError,
} from '@/types/errors';

export const throwFromActionError = (code: string, message: string): never => {
  switch (code) {
    case 'VALIDATION_ERROR':
      throw new ValidationError(message);
    case 'FUTURE_DATE_NOT_ALLOWED':
      throw new FutureDateError(message);
    case 'DUPLICATE_DATE_ENTRY':
      throw new DuplicateDateEntryError(message);
    case 'CONTENT_TOO_LONG':
      throw new ContentTooLongError(message);
    default:
      // NOT_FOUND, INTERNAL_ERROR, FETCH_FAILED, LOAD_FAILED などの既知外コードも
      // 一時的な障害として SaveFailedError に変換し、リトライ対象として扱う。
      throw new SaveFailedError(message);
  }
};
