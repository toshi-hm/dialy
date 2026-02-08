import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { FetchFailedError, SaveFailedError } from '@/types/errors';
import {
  UpdateDiaryEntrySchema,
  type UpdateDiaryEntryInput,
} from '@/lib/validations/diary';

export class UpdateDiaryEntryUseCase {
  constructor(private readonly repository: DiaryRepository) {}

  async execute(input: UpdateDiaryEntryInput): Promise<DiaryEntry> {
    const validated = UpdateDiaryEntrySchema.parse(input);
    const existing = await this.repository.findById(validated.id);

    if (!existing) {
      throw new FetchFailedError('Diary entry not found');
    }

    const updated = existing.update(validated.content);

    try {
      await this.repository.save(updated);
    } catch (error) {
      throw new SaveFailedError('Failed to save diary entry', error);
    }

    return updated;
  }
}
