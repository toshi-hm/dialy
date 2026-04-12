import type { DiaryEntry } from '@/lib/domain/diary-entry';

export type DiaryRepository = {
  save(entry: DiaryEntry): Promise<void>;
  findById(id: string): Promise<DiaryEntry | null>;
  findByDate(date: Date, userId?: string | null): Promise<DiaryEntry | null>;
  findBySameDate(date: Date, years?: number, userId?: string | null): Promise<DiaryEntry[]>;
  delete(id: string): Promise<void>;
  findAll(userId?: string | null): Promise<DiaryEntry[]>;
  search(query: string, userId?: string | null): Promise<DiaryEntry[]>;
};
