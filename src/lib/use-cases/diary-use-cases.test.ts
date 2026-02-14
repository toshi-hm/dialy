import { describe, expect, it, vi } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import {
  ContentTooLongError,
  DuplicateDateEntryError,
  FutureDateError,
  ValidationError,
} from '@/types/errors';
import { CreateDiaryEntryUseCase } from './create-diary-entry';
import { DeleteDiaryEntryUseCase } from './delete-diary-entry';
import { GetDiaryEntryUseCase } from './get-diary-entry';
import { GetEntriesBySameDateUseCase } from './get-entries-by-same-date';
import { UpdateDiaryEntryUseCase } from './update-diary-entry';

const createRepositoryMock = (): DiaryRepository => {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByDate: vi.fn(),
    findBySameDate: vi.fn(),
    delete: vi.fn(),
    findAll: vi.fn(),
  };
};

describe('diary use cases', () => {
  it('creates a diary entry and saves it', async () => {
    const repository = createRepositoryMock();
    const useCase = new CreateDiaryEntryUseCase(repository);
    const inputDate = new Date('2026-02-08T00:00:00.000Z');
    vi.mocked(repository.findByDate).mockResolvedValue(null);

    const result = await useCase.execute({
      date: inputDate,
      content: 'new diary entry',
    });

    expect(repository.findByDate).toHaveBeenCalledWith(inputDate);
    expect(repository.save).toHaveBeenCalledWith(expect.any(DiaryEntry));
    expect(result.content).toBe('new diary entry');
  });

  it('throws ValidationError when creating duplicate date entry', async () => {
    const repository = createRepositoryMock();
    const useCase = new CreateDiaryEntryUseCase(repository);
    const existing = DiaryEntry.reconstruct(
      '550e8400-e29b-41d4-a716-446655440000',
      new Date('2026-02-08T00:00:00.000Z'),
      'existing',
      new Date('2026-02-08T00:00:00.000Z'),
      new Date('2026-02-08T00:00:00.000Z'),
    );
    vi.mocked(repository.findByDate).mockResolvedValue(existing);

    await expect(
      useCase.execute({
        date: new Date('2026-02-08T00:00:00.000Z'),
        content: 'duplicate',
      }),
    ).rejects.toThrow(DuplicateDateEntryError);
  });

  it('throws ContentTooLongError when creating an over-limit entry', async () => {
    const repository = createRepositoryMock();
    const useCase = new CreateDiaryEntryUseCase(repository);

    await expect(
      useCase.execute({
        date: new Date('2026-02-08T00:00:00.000Z'),
        content: 'a'.repeat(10_001),
      }),
    ).rejects.toThrow(ContentTooLongError);
  });

  it('updates a diary entry and persists changes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08T10:00:00.000Z'));

    const repository = createRepositoryMock();
    const useCase = new UpdateDiaryEntryUseCase(repository);
    const existing = DiaryEntry.reconstruct(
      '550e8400-e29b-41d4-a716-446655440000',
      new Date('2026-02-08T00:00:00.000Z'),
      'before',
      new Date('2026-02-08T00:00:00.000Z'),
      new Date('2026-02-08T00:00:00.000Z'),
    );
    vi.mocked(repository.findById).mockResolvedValue(existing);

    vi.setSystemTime(new Date('2026-02-08T11:00:00.000Z'));
    const result = await useCase.execute({
      id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'after',
    });

    expect(repository.save).toHaveBeenCalledWith(expect.any(DiaryEntry));
    expect(result.content).toBe('after');
    expect(result.updatedAt.toISOString()).toBe('2026-02-08T11:00:00.000Z');

    vi.useRealTimers();
  });

  it('throws ValidationError when updating with invalid id', async () => {
    const repository = createRepositoryMock();
    const useCase = new UpdateDiaryEntryUseCase(repository);

    await expect(
      useCase.execute({
        id: 'invalid-id',
        content: 'after',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('deletes a diary entry by id', async () => {
    const repository = createRepositoryMock();
    const useCase = new DeleteDiaryEntryUseCase(repository);

    await useCase.execute({ id: '550e8400-e29b-41d4-a716-446655440000' });

    expect(repository.delete).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
  });

  it('throws ValidationError when deleting with invalid id', async () => {
    const repository = createRepositoryMock();
    const useCase = new DeleteDiaryEntryUseCase(repository);

    await expect(useCase.execute({ id: 'invalid-id' })).rejects.toThrow(ValidationError);
  });

  it('gets a diary entry by date', async () => {
    const repository = createRepositoryMock();
    const useCase = new GetDiaryEntryUseCase(repository);
    const entry = DiaryEntry.reconstruct(
      '550e8400-e29b-41d4-a716-446655440000',
      new Date('2026-02-08T00:00:00.000Z'),
      'entry',
      new Date('2026-02-08T00:00:00.000Z'),
      new Date('2026-02-08T00:00:00.000Z'),
    );
    vi.mocked(repository.findByDate).mockResolvedValue(entry);

    const result = await useCase.execute(new Date('2026-02-08T00:00:00.000Z'));

    expect(result).toBe(entry);
  });

  it('throws FutureDateError when getting diary entry for future date', async () => {
    const repository = createRepositoryMock();
    const useCase = new GetDiaryEntryUseCase(repository);

    await expect(useCase.execute(new Date('2999-01-01T00:00:00.000Z'))).rejects.toThrow(
      FutureDateError,
    );
  });

  it('gets entries by same date', async () => {
    const repository = createRepositoryMock();
    const useCase = new GetEntriesBySameDateUseCase(repository);
    const entries = [
      DiaryEntry.reconstruct(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2025-02-08T00:00:00.000Z'),
        'past',
        new Date('2025-02-08T00:00:00.000Z'),
        new Date('2025-02-08T00:00:00.000Z'),
      ),
    ];
    vi.mocked(repository.findBySameDate).mockResolvedValue(entries);

    const result = await useCase.execute(new Date('2026-02-08T00:00:00.000Z'), 5);

    expect(repository.findBySameDate).toHaveBeenCalledWith(new Date('2026-02-08T00:00:00.000Z'), 5);
    expect(result).toEqual(entries);
  });

  it('throws ValidationError when years is invalid', async () => {
    const repository = createRepositoryMock();
    const useCase = new GetEntriesBySameDateUseCase(repository);

    await expect(useCase.execute(new Date('2026-02-08T00:00:00.000Z'), 0)).rejects.toThrow(
      ValidationError,
    );
  });
});
