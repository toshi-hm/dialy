export interface DiaryEntryData {
  id: string;
  date: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiaryEntryInput {
  date: Date;
  content: string;
}

export interface UpdateDiaryEntryInput {
  id: string;
  content: string;
}

export interface DeleteDiaryEntryInput {
  id: string;
}

export interface StoredDiaryEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryStorage {
  version: string;
  entries: StoredDiaryEntry[];
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface DiaryPreviewData {
  id: string;
  year: number;
  preview: string;
  characterCount: number;
}
