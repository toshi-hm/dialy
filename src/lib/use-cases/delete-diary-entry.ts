import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { type DeleteDiaryEntryInput, DeleteDiaryEntrySchema } from '@/lib/validations/diary';
import { SaveFailedError } from '@/types/errors';

export class DeleteDiaryEntryUseCase {
  constructor(private readonly repository: DiaryRepository) {}

  async execute(input: DeleteDiaryEntryInput): Promise<void> {
    const validated = DeleteDiaryEntrySchema.parse(input);

    try {
      await this.repository.delete(validated.id);
    } catch (error) {
      throw new SaveFailedError('Failed to delete diary entry', error);
    }
  }
}
