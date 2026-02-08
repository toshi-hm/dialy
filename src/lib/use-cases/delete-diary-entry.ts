import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { SaveFailedError } from '@/types/errors';
import {
  DeleteDiaryEntrySchema,
  type DeleteDiaryEntryInput,
} from '@/lib/validations/diary';

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
