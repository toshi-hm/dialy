import { z } from 'zod';

export const diaryEntrySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  content: z.string().min(1, 'Content is required'),
  date: z.date(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type DiaryEntry = z.infer<typeof diaryEntrySchema>;
