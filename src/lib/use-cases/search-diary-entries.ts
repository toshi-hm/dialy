import type { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { FetchFailedError, ValidationError } from '@/types/errors';

const MAX_QUERY_LENGTH = 200;

export class SearchDiaryEntriesUseCase {
  constructor(private readonly repository: DiaryRepository) {}

  async execute(query: string, userId: string | null = null): Promise<DiaryEntry[]> {
    if (!query.trim()) {
      return [];
    }

    if (query.length > MAX_QUERY_LENGTH) {
      throw new ValidationError(`Search query must not exceed ${MAX_QUERY_LENGTH} characters`);
    }

    try {
      return await this.repository.search(query.trim(), userId);
    } catch (error) {
      throw new FetchFailedError('Failed to search diary entries', error);
    }
  }
}
