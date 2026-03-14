import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { DuplicateDateEntryError } from '@/types/errors';
import type { PrismaClient } from '../../generated/prisma/client';

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

const toStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export class PrismaDiaryRepository implements DiaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(entry: DiaryEntry): Promise<void> {
    const dateForDb = toStartOfDay(entry.date);

    const existing = await this.prisma.diaryEntry.findUnique({
      where: { id: entry.id },
    });

    if (!existing) {
      const duplicate = await this.prisma.diaryEntry.findFirst({
        where: {
          date: dateForDb,
          id: { not: entry.id },
        },
      });

      if (duplicate) {
        throw new DuplicateDateEntryError('An entry for this date already exists');
      }

      await this.prisma.diaryEntry.create({
        data: {
          id: entry.id,
          date: dateForDb,
          content: entry.content,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          tags: {
            create: entry.tags.map((name) => ({
              id: crypto.randomUUID(),
              name,
            })),
          },
        },
      });
    } else {
      await this.prisma.diaryEntryTag.deleteMany({
        where: { entryId: entry.id },
      });

      await this.prisma.diaryEntry.update({
        where: { id: entry.id },
        data: {
          content: entry.content,
          updatedAt: entry.updatedAt,
          tags: {
            create: entry.tags.map((name) => ({
              id: crypto.randomUUID(),
              name,
            })),
          },
        },
      });
    }
  }

  async findById(id: string): Promise<DiaryEntry | null> {
    const record = await this.prisma.diaryEntry.findUnique({
      where: { id },
      include: { tags: true },
    });

    return record ? toDomainEntry(record) : null;
  }

  async findByDate(date: Date): Promise<DiaryEntry | null> {
    const start = toStartOfDay(date);
    const end = toEndOfDay(date);

    const record = await this.prisma.diaryEntry.findFirst({
      where: {
        date: { gte: start, lte: end },
      },
      include: { tags: true },
    });

    return record ? toDomainEntry(record) : null;
  }

  async findBySameDate(date: Date, years: number = 5): Promise<DiaryEntry[]> {
    const month = date.getMonth();
    const day = date.getDate();
    const currentYear = date.getFullYear();
    const minYear = currentYear - years;

    const allEntries = await this.prisma.diaryEntry.findMany({
      include: { tags: true },
      orderBy: { date: 'desc' },
    });

    return allEntries
      .filter((record) => {
        const entryDate = new Date(record.date);
        const entryYear = entryDate.getFullYear();
        return (
          entryDate.getMonth() === month &&
          entryDate.getDate() === day &&
          entryYear < currentYear &&
          entryYear >= minYear
        );
      })
      .map(toDomainEntry);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.diaryEntry.delete({
      where: { id },
    });
  }

  async findAll(): Promise<DiaryEntry[]> {
    const records = await this.prisma.diaryEntry.findMany({
      include: { tags: true },
    });

    return records.map(toDomainEntry);
  }
}
