import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { parseISODate } from '@/lib/utils/date';
import { DuplicateDateEntryError, NotFoundError } from '@/types/errors';
import { Prisma, type PrismaClient } from '../../generated/prisma/client';
import { PrismaDiaryRepository } from './prisma-diary-repository';

type MockPrismaEntry = {
  id: string;
  date: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: { name: string }[];
  userId: string | null;
};

const makePrismaEntry = (overrides: Partial<MockPrismaEntry> = {}): MockPrismaEntry => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  date: new Date('2026-02-08T00:00:00.000Z'),
  content: 'test content',
  createdAt: new Date('2026-02-08T00:00:00.000Z'),
  updatedAt: new Date('2026-02-08T00:00:00.000Z'),
  tags: [],
  userId: null,
  ...overrides,
});

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

const makeMockTx = () => ({
  diaryEntry: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  diaryEntryTag: {
    deleteMany: vi.fn(),
  },
});

const makeMockPrisma = (mockTx: ReturnType<typeof makeMockTx>) => ({
  $transaction: vi.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(mockTx)),
  diaryEntry: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  diaryEntryTag: {
    count: vi.fn(),
  },
});

describe('PrismaDiaryRepository', () => {
  let mockTx: ReturnType<typeof makeMockTx>;
  let mockPrisma: ReturnType<typeof makeMockPrisma>;
  let repository: PrismaDiaryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = makeMockTx();
    mockPrisma = makeMockPrisma(mockTx);
    repository = new PrismaDiaryRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('save()', () => {
    it('creates new entry when no existing entry exists', async () => {
      const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'entry');
      mockTx.diaryEntry.findUnique.mockResolvedValue(null);
      mockTx.diaryEntry.findFirst.mockResolvedValue(null);
      mockTx.diaryEntry.create.mockResolvedValue(undefined);

      await expect(repository.save(entry)).resolves.not.toThrow();

      expect(mockTx.diaryEntry.create).toHaveBeenCalledTimes(1);
    });

    it('creates new entry with tags', async () => {
      const entry = reconstructEntry(
        '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-08',
        'entry',
        ['仕事', '勉強'],
      );
      mockTx.diaryEntry.findUnique.mockResolvedValue(null);
      mockTx.diaryEntry.findFirst.mockResolvedValue(null);
      mockTx.diaryEntry.create.mockResolvedValue(undefined);

      await repository.save(entry);

      expect(mockTx.diaryEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: { create: [{ name: '仕事' }, { name: '勉強' }] },
          }),
        }),
      );
    });

    it('throws DuplicateDateEntryError when duplicate date entry exists', async () => {
      const entry = reconstructEntry(
        '550e8400-e29b-41d4-a716-446655440001',
        '2026-02-08',
        'second',
      );
      const duplicate = makePrismaEntry({ id: '550e8400-e29b-41d4-a716-446655440000' });
      mockTx.diaryEntry.findUnique.mockResolvedValue(null);
      mockTx.diaryEntry.findFirst.mockResolvedValue(duplicate);

      await expect(repository.save(entry)).rejects.toThrow(DuplicateDateEntryError);
    });

    it('updates existing entry content and replaces tags', async () => {
      const existing = makePrismaEntry({ content: 'original' });
      const entry = reconstructEntry(
        '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-08',
        'updated content',
        ['new-tag'],
      );
      mockTx.diaryEntry.findUnique.mockResolvedValue(existing);
      mockTx.diaryEntryTag.deleteMany.mockResolvedValue({ count: 1 });
      mockTx.diaryEntry.update.mockResolvedValue(undefined);

      await repository.save(entry);

      expect(mockTx.diaryEntryTag.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.diaryEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'updated content',
            tags: { create: [{ name: 'new-tag' }] },
          }),
        }),
      );
    });
  });

  describe('findById()', () => {
    it('returns DiaryEntry when found', async () => {
      const record = makePrismaEntry({ content: 'entry', tags: [{ name: '仕事' }] });
      mockPrisma.diaryEntry.findUnique.mockResolvedValue(record);

      const result = await repository.findById('550e8400-e29b-41d4-a716-446655440000');

      expect(result).not.toBeNull();
      expect(result?.content).toBe('entry');
      expect(result?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result?.tags).toEqual(['仕事']);
    });

    it('returns null for non-existent id', async () => {
      mockPrisma.diaryEntry.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByDate()', () => {
    it('returns DiaryEntry when found', async () => {
      const record = makePrismaEntry({ content: 'entry' });
      mockPrisma.diaryEntry.findFirst.mockResolvedValue(record);

      const result = await repository.findByDate(parseISODate('2026-02-08'));

      expect(result).not.toBeNull();
      expect(result?.content).toBe('entry');
    });

    it('returns null for non-existent date', async () => {
      mockPrisma.diaryEntry.findFirst.mockResolvedValue(null);

      const result = await repository.findByDate(parseISODate('2026-01-01'));

      expect(result).toBeNull();
    });
  });

  describe('findBySameDate()', () => {
    it('returns entries sorted by date descending', async () => {
      const records = [
        makePrismaEntry({
          id: '550e8400-e29b-41d4-a716-446655440000',
          date: new Date('2025-02-08T00:00:00.000Z'),
          content: '2025',
        }),
        makePrismaEntry({
          id: '550e8400-e29b-41d4-a716-446655440001',
          date: new Date('2024-02-08T00:00:00.000Z'),
          content: '2024',
        }),
        makePrismaEntry({
          id: '550e8400-e29b-41d4-a716-446655440002',
          date: new Date('2023-02-08T00:00:00.000Z'),
          content: '2023',
        }),
      ];
      mockPrisma.diaryEntry.findMany.mockResolvedValue(records);

      const result = await repository.findBySameDate(parseISODate('2026-02-08'), 3);

      expect(result).toHaveLength(3);
      expect(result.map((e) => e.content)).toEqual(['2025', '2024', '2023']);
    });

    it('returns empty array when no same-date entries exist', async () => {
      mockPrisma.diaryEntry.findMany.mockResolvedValue([]);

      const result = await repository.findBySameDate(parseISODate('2026-02-08'), 5);

      expect(result).toEqual([]);
    });

    it('returns empty array when years is 0', async () => {
      const result = await repository.findBySameDate(parseISODate('2026-02-08'), 0);

      expect(result).toEqual([]);
      expect(mockPrisma.diaryEntry.findMany).not.toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('deletes entry successfully', async () => {
      mockPrisma.diaryEntry.delete.mockResolvedValue(undefined);

      await expect(
        repository.delete('550e8400-e29b-41d4-a716-446655440000'),
      ).resolves.not.toThrow();

      expect(mockPrisma.diaryEntry.delete).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
    });

    it('throws NotFoundError when deleting non-existent id', async () => {
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: 'test' },
      );
      mockPrisma.diaryEntry.delete.mockRejectedValue(p2025Error);

      await expect(repository.delete('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('re-throws non-P2025 errors as-is', async () => {
      const unexpectedError = new Error('Connection failed');
      mockPrisma.diaryEntry.delete.mockRejectedValue(unexpectedError);

      await expect(repository.delete('some-id')).rejects.toThrow('Connection failed');
    });
  });

  describe('findAll()', () => {
    it('returns all entries sorted by date descending', async () => {
      const records = [
        makePrismaEntry({
          id: '550e8400-e29b-41d4-a716-446655440001',
          date: new Date('2026-02-08T00:00:00.000Z'),
          content: 'newer',
        }),
        makePrismaEntry({
          id: '550e8400-e29b-41d4-a716-446655440000',
          date: new Date('2026-02-07T00:00:00.000Z'),
          content: 'older',
        }),
      ];
      mockPrisma.diaryEntry.findMany.mockResolvedValue(records);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('newer');
      expect(result[1].content).toBe('older');
    });

    it('returns empty array when no entries exist', async () => {
      mockPrisma.diaryEntry.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });
});
