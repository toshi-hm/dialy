import { z } from 'zod';
import { isFutureDate } from '@/lib/utils/date';

export const DiaryDateSchema = z.date().refine((date) => !isFutureDate(date), {
  message: 'Future date is not allowed',
});

export const DiaryEntrySchema = z.object({
  date: DiaryDateSchema,
  content: z.string().max(10_000, 'Content exceeds maximum length (10,000 characters)'),
});

export type DiaryEntryInput = z.infer<typeof DiaryEntrySchema>;

export const CreateDiaryEntrySchema = DiaryEntrySchema;
export type CreateDiaryEntryInput = z.infer<typeof CreateDiaryEntrySchema>;

const DiaryEntryIdSchema = z.string().uuid('Invalid ID format');

export const UpdateDiaryEntrySchema = z.object({
  id: DiaryEntryIdSchema,
  content: z.string().max(10_000, 'Content exceeds maximum length (10,000 characters)'),
});
export type UpdateDiaryEntryInput = z.infer<typeof UpdateDiaryEntrySchema>;

export const DeleteDiaryEntrySchema = z.object({
  id: DiaryEntryIdSchema,
});
export type DeleteDiaryEntryInput = z.infer<typeof DeleteDiaryEntrySchema>;

export const GetEntriesBySameDateSchema = z.object({
  date: DiaryDateSchema,
  years: z.number().int().positive().max(50).default(5),
});
export type GetEntriesBySameDateInput = z.infer<typeof GetEntriesBySameDateSchema>;

// Backward-compatible alias until all imports are migrated.
export const diaryEntrySchema = DiaryEntrySchema;
