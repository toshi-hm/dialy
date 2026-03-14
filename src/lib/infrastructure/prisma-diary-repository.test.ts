// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { parseISODate } from '@/lib/utils/date';
import { DuplicateDateEntryError } from '@/types/errors';
import { PrismaDiaryRepository } from './prisma-diary-repository';
import { createTestPrismaClient, setupTestDatabase } from './prisma-test-setup';

const prisma = createTestPrismaClient();

const reconstructEntry = (
  id: string,
  date: string,
  content: string,
  tags: string[] = [],
): DiaryEntry => {
  return DiaryEntry.reconstruct(
    id,
    parseISODate(date),
    content,
    parseISODate('2026-02-08'),
    parseISODate('2026-02-08'),
    tags,
  );
};

describe('PrismaDiaryRepository', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('DELETE FROM diary_entry_tags');
    await prisma.$executeRawUnsafe('DELETE FROM diary_entries');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('saves and retrieves entries by id', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'entry');

    await repository.save(entry);

    const byId = await repository.findById(entry.id);

    expect(byId).not.toBeNull();
    expect(byId?.content).toBe('entry');
    expect(byId?.id).toBe(entry.id);
  });

  it('saves and retrieves entries by date', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'entry');

    await repository.save(entry);

    const byDate = await repository.findByDate(parseISODate('2026-02-08'));

    expect(byDate).not.toBeNull();
    expect(byDate?.id).toBe(entry.id);
    expect(byDate?.content).toBe('entry');
  });

  it('saves and restores tags', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'entry', [
      '仕事',
      '勉強',
    ]);

    await repository.save(entry);
    const byId = await repository.findById(entry.id);

    expect(byId?.tags).toEqual(['仕事', '勉強']);
  });

  it('updates existing entry content', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    const entry = reconstructEntry(
      '550e8400-e29b-41d4-a716-446655440000',
      '2026-02-08',
      'original',
    );

    await repository.save(entry);

    const updated = entry.update('updated content');
    await repository.save(updated);

    const byId = await repository.findById(entry.id);
    expect(byId?.content).toBe('updated content');
  });

  it('updates existing entry tags', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'entry', [
      '仕事',
    ]);

    await repository.save(entry);

    const updated = entry.updateTags(['勉強', '趣味']);
    await repository.save(updated);

    const byId = await repository.findById(entry.id);
    expect(byId?.tags).toEqual(['勉強', '趣味']);
  });

  it('throws DuplicateDateEntryError when duplicate date entry is saved', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    const first = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'first');
    const second = reconstructEntry('550e8400-e29b-41d4-a716-446655440001', '2026-02-08', 'second');

    await repository.save(first);

    await expect(repository.save(second)).rejects.toThrow(DuplicateDateEntryError);
  });

  it('finds entries by same date in past years sorted desc', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2025-02-08', '2025'),
    );
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440001', '2024-02-08', '2024'),
    );
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440002', '2023-02-08', '2023'),
    );
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440003', '2025-02-07', 'other'),
    );

    const result = await repository.findBySameDate(parseISODate('2026-02-08'), 3);

    expect(result).toHaveLength(3);
    expect(result.map((entry) => entry.content)).toEqual(['2025', '2024', '2023']);
  });

  it('deletes entry by id', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    const entry = reconstructEntry(
      '550e8400-e29b-41d4-a716-446655440000',
      '2026-02-08',
      'to-delete',
    );
    await repository.save(entry);

    await repository.delete(entry.id);

    expect(await repository.findById(entry.id)).toBeNull();
  });

  it('deletes entry and its tags (cascade)', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    const entry = reconstructEntry(
      '550e8400-e29b-41d4-a716-446655440000',
      '2026-02-08',
      'tagged-delete',
      ['tag1', 'tag2'],
    );
    await repository.save(entry);

    await repository.delete(entry.id);

    expect(await repository.findById(entry.id)).toBeNull();
    const tagCount = await prisma.diaryEntryTag.count();
    expect(tagCount).toBe(0);
  });

  it('finds all entries', async () => {
    const repository = new PrismaDiaryRepository(prisma);
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-07', 'one'),
    );
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440001', '2026-02-08', 'two'),
    );

    const all = await repository.findAll();

    expect(all).toHaveLength(2);
  });

  it('returns null for non-existent id', async () => {
    const repository = new PrismaDiaryRepository(prisma);

    const result = await repository.findById('non-existent-id');

    expect(result).toBeNull();
  });

  it('returns null for non-existent date', async () => {
    const repository = new PrismaDiaryRepository(prisma);

    const result = await repository.findByDate(parseISODate('2026-01-01'));

    expect(result).toBeNull();
  });

  it('returns empty array when no same-date entries exist', async () => {
    const repository = new PrismaDiaryRepository(prisma);

    const result = await repository.findBySameDate(parseISODate('2026-02-08'), 5);

    expect(result).toEqual([]);
  });
});
