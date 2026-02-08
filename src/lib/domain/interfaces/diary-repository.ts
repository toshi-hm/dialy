import type { DiaryEntry } from '@/lib/domain/diary-entry';

export type DiaryRepository = {
  save(entry: DiaryEntry): Promise<void>;
  findById(id: string): Promise<DiaryEntry | null>;
  findByDate(date: Date): Promise<DiaryEntry | null>;
  findBySameDate(date: Date, years?: number): Promise<DiaryEntry[]>;
  delete(id: string): Promise<void>;
  findAll(): Promise<DiaryEntry[]>;
};
