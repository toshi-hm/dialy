import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { type DeleteDiaryEntryInput, DeleteDiaryEntrySchema } from '@/lib/validations/diary';
import { FetchFailedError, isAppError, SaveFailedError } from '@/types/errors';
import { parseOrThrowAppError } from './parse-or-throw-app-error';

export class DeleteDiaryEntryUseCase {
  constructor(private readonly repository: DiaryRepository) {}

  async execute(input: DeleteDiaryEntryInput, userId: string | null = null): Promise<void> {
    const validated = parseOrThrowAppError(DeleteDiaryEntrySchema, input);

    if (userId !== null) {
      const existing = await this.repository.findById(validated.id);
      if (!existing || existing.userId !== userId) {
        throw new FetchFailedError('Diary entry not found');
      }
    }

    try {
      await this.repository.delete(validated.id);
    } catch (error) {
      if (isAppError(error)) {
        throw error;
      }
      throw new SaveFailedError('Failed to delete diary entry', error);
    }
  }
}
