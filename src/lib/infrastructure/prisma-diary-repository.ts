import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { DuplicateDateEntryError, NotFoundError } from '@/types/errors';
import { Prisma, type PrismaClient } from '../../generated/prisma/client';

type PrismaEntryWithTags = {
  id: string;
  date: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: { name: string }[];
};

const toDomainEntry = (record: PrismaEntryWithTags): DiaryEntry => {
  return DiaryEntry.reconstruct(
    record.id,
    record.date,
    record.content,
    record.createdAt,
    record.updatedAt,
    record.tags.map((t) => t.name),
  );
};

/** UTC の 00:00:00.000 に正規化する（タイムゾーン非依存） */
const toStartOfDayUTC = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/** UTC の 23:59:59.999 に正規化する（タイムゾーン非依存） */
const toEndOfDayUTC = (date: Date): Date => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
};

export class PrismaDiaryRepository implements DiaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(entry: DiaryEntry): Promise<void> {
    const dateForDb = toStartOfDayUTC(entry.date);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.diaryEntry.findUnique({
        where: { id: entry.id },
      });

      if (!existing) {
        const duplicate = await tx.diaryEntry.findFirst({
          where: {
            date: dateForDb,
            id: { not: entry.id },
          },
        });

        if (duplicate) {
          throw new DuplicateDateEntryError('An entry for this date already exists');
        }

        await tx.diaryEntry.create({
          data: {
            id: entry.id,
            date: dateForDb,
            content: entry.content,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            tags: {
              create: entry.tags.map((name) => ({ name })),
            },
          },
        });
      } else {
        await tx.diaryEntryTag.deleteMany({
          where: { entryId: entry.id },
        });

        await tx.diaryEntry.update({
          where: { id: entry.id },
          data: {
            content: entry.content,
            updatedAt: entry.updatedAt,
            tags: {
              create: entry.tags.map((name) => ({ name })),
            },
          },
        });
      }
    });
  }

  async findById(id: string): Promise<DiaryEntry | null> {
    const record = await this.prisma.diaryEntry.findUnique({
      where: { id },
      include: { tags: true },
    });

    return record ? toDomainEntry(record) : null;
  }

  async findByDate(date: Date): Promise<DiaryEntry | null> {
    const start = toStartOfDayUTC(date);
    const end = toEndOfDayUTC(date);

    const record = await this.prisma.diaryEntry.findFirst({
      where: {
        date: { gte: start, lte: end },
      },
      include: { tags: true },
    });

    return record ? toDomainEntry(record) : null;
  }

  async findBySameDate(date: Date, years: number = 5): Promise<DiaryEntry[]> {
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const currentYear = date.getUTCFullYear();
    const minYear = currentYear - years;

    const targetDates: Date[] = [];
    for (let y = currentYear - 1; y >= minYear; y--) {
      targetDates.push(new Date(Date.UTC(y, month, day)));
    }

    if (targetDates.length === 0) {
      return [];
    }

    const entries = await this.prisma.diaryEntry.findMany({
      where: {
        date: { in: targetDates },
      },
      include: { tags: true },
      orderBy: { date: 'desc' },
    });

    return entries.map(toDomainEntry);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.diaryEntry.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError('Diary entry not found');
      }
      throw error;
    }
  }

  async findAll(): Promise<DiaryEntry[]> {
    const records = await this.prisma.diaryEntry.findMany({
      include: { tags: true },
      orderBy: { date: 'desc' },
    });

    return records.map(toDomainEntry);
  }
}
