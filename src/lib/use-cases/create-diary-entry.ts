import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { type CreateDiaryEntryInput, CreateDiaryEntrySchema } from '@/lib/validations/diary';
import { DuplicateDateEntryError, SaveFailedError } from '@/types/errors';

export class CreateDiaryEntryUseCase {
  constructor(private readonly repository: DiaryRepository) { }

  async execute(input: CreateDiaryEntryInput): Promise<DiaryEntry> {
    const validated = CreateDiaryEntrySchema.parse(input);

    const existing = await this.repository.findByDate(validated.date);
    if (existing) {
      throw new DuplicateDateEntryError('An entry for this date already exists');
    }

    const entry = DiaryEntry.create(validated.date, validated.content);

    try {
      await this.repository.save(entry);
    } catch (error) {
      throw new SaveFailedError('Failed to save diary entry', error);
    }

    return entry;
  }
}
