import type { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { DiaryDateSchema } from '@/lib/validations/diary';
import { FetchFailedError } from '@/types/errors';

export class GetDiaryEntryUseCase {
  constructor(private readonly repository: DiaryRepository) {}

  async execute(date: Date): Promise<DiaryEntry | null> {
    const validatedDate = DiaryDateSchema.parse(date);

    try {
      return await this.repository.findByDate(validatedDate);
    } catch (error) {
      throw new FetchFailedError('Failed to load diary entry', error);
    }
  }
}
