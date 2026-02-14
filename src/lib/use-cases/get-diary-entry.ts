import type { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { DiaryDateSchema } from '@/lib/validations/diary';
import { FetchFailedError } from '@/types/errors';
import { parseOrThrowAppError } from './parse-or-throw-app-error';

export class GetDiaryEntryUseCase {
  constructor(private readonly repository: DiaryRepository) {}

  async execute(date: Date): Promise<DiaryEntry | null> {
    const validatedDate = parseOrThrowAppError(DiaryDateSchema, date);

    try {
      return await this.repository.findByDate(validatedDate);
    } catch (error) {
      throw new FetchFailedError('Failed to load diary entry', error);
    }
  }
}
