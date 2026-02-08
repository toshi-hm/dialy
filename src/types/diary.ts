export type DiaryEntryData = {
  id: string;
  date: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateDiaryEntryInput = {
  date: Date;
  content: string;
};

export type UpdateDiaryEntryInput = {
  id: string;
  content: string;
};

export type DeleteDiaryEntryInput = {
  id: string;
};

export type StoredDiaryEntry = {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type DiaryStorage = {
  version: string;
  entries: StoredDiaryEntry[];
};

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type DiaryPreviewData = {
  id: string;
  year: number;
  preview: string;
  characterCount: number;
};
