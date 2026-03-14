export type DiaryEntryData = {
  id: string;
  date: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
};

export type CreateDiaryEntryInput = {
  date: Date;
  content: string;
  tags?: string[];
};

export type UpdateDiaryEntryInput = {
  id: string;
  content: string;
  tags?: string[];
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
  tags?: string[];
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
