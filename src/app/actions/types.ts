import type { AppErrorCode } from '@/types/errors';

export type SerializedDiaryEntry = {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionFailure = {
  success: false;
  error: {
    code: AppErrorCode;
    message: string;
  };
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
