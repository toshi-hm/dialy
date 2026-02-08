import type { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { GetEntriesBySameDateSchema } from '@/lib/validations/diary';
import { FetchFailedError } from '@/types/errors';

export class GetEntriesBySameDateUseCase {
  constructor(private readonly repository: DiaryRepository) {}

  async execute(date: Date, years: number = 5): Promise<DiaryEntry[]> {
    const validated = GetEntriesBySameDateSchema.parse({ date, years });

    try {
      return await this.repository.findBySameDate(validated.date, validated.years);
    } catch (error) {
      throw new FetchFailedError('Failed to load diary entries', error);
    }
  }
}
