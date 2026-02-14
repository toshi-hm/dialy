import type { DiaryEntry } from '@/lib/domain/diary-entry';

export class DiaryService {
  getEntriesBySameDate(entries: DiaryEntry[], date: Date, years: number = 5): DiaryEntry[] {
    const month = date.getMonth();
    const day = date.getDate();
    const currentYear = date.getFullYear();
    const minYear = currentYear - years;

    return this.sortByDateDesc(
      entries.filter((entry) => {
        const entryYear = entry.date.getFullYear();
        return (
          entry.date.getMonth() === month &&
          entry.date.getDate() === day &&
          entryYear < currentYear &&
          entryYear >= minYear
        );
      }),
    );
  }

  sortByDateDesc(entries: DiaryEntry[]): DiaryEntry[] {
    return [...entries].sort((left, right) => right.date.getTime() - left.date.getTime());
  }
}
