import { z } from 'zod';
import { isFutureDate } from '@/lib/utils/date';

export const DiaryDateSchema = z.date().refine((date) => !isFutureDate(date), {
  message: 'Future date is not allowed',
});

export const DiaryTagSchema = z
  .string()
  .min(1, 'Tag must not be empty')
  .max(20, 'Each tag must not exceed 20 characters');

const DiaryTagsBaseSchema = z.array(DiaryTagSchema).max(10, 'Tags must not exceed 10 items');

export const DiaryTagsSchema = DiaryTagsBaseSchema.default([]);

export const DiaryEntrySchema = z.object({
  date: DiaryDateSchema,
  content: z.string().max(10_000, 'Content exceeds maximum length (10,000 characters)'),
  tags: DiaryTagsSchema,
});

export type DiaryEntryInput = z.input<typeof DiaryEntrySchema>;

export const CreateDiaryEntrySchema = DiaryEntrySchema;
export type CreateDiaryEntryInput = z.input<typeof CreateDiaryEntrySchema>;

const DiaryEntryIdSchema = z.string().uuid('Invalid ID format');

export const UpdateDiaryEntrySchema = z.object({
  id: DiaryEntryIdSchema,
  content: z.string().max(10_000, 'Content exceeds maximum length (10,000 characters)'),
  tags: DiaryTagsBaseSchema.optional(),
});
export type UpdateDiaryEntryInput = z.input<typeof UpdateDiaryEntrySchema>;

export const DeleteDiaryEntrySchema = z.object({
  id: DiaryEntryIdSchema,
});
export type DeleteDiaryEntryInput = z.input<typeof DeleteDiaryEntrySchema>;

export const GetEntriesBySameDateSchema = z.object({
  date: DiaryDateSchema,
  years: z.number().int().positive().max(50).default(5),
});
export type GetEntriesBySameDateInput = z.input<typeof GetEntriesBySameDateSchema>;

/** Server Action 境界で文字列をDateに変換・検証するスキーマ */
export const ServerActionDateSchema = z
  .string()
  .transform((val) => new Date(val))
  .refine((date) => !Number.isNaN(date.getTime()), { message: 'Invalid date format' });

// Backward-compatible alias until all imports are migrated.
export const diaryEntrySchema = DiaryEntrySchema;
