import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { DuplicateDateEntryError, NotFoundError } from '@/types/errors';

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const createMockEntries = (): DiaryEntry[] => {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  return [
    DiaryEntry.reconstruct(
      'mock-1',
      new Date(y - 1, m, d),
      '1年前の今日。あの頃は毎日が新鮮だった。\n\nこの日は友人と公園を散歩して、久しぶりにゆっくり話せた気がする。',
      new Date(y - 1, m, d, 9, 0),
      new Date(y - 1, m, d, 9, 15),
      ['思い出', '友人'],
    ),
    DiaryEntry.reconstruct(
      'mock-2',
      new Date(y - 2, m, d),
      '2年前の今日。\n\n新しいプロジェクトが始まった日。不安と期待が入り混じっていた。今思えば良い経験だった。',
      new Date(y - 2, m, d, 21, 0),
      new Date(y - 2, m, d, 21, 30),
      ['仕事', '振り返り'],
    ),
    DiaryEntry.reconstruct(
      'mock-3',
      new Date(y - 3, m, d),
      '3年前の今日。\n\n雨が続く季節。読書が捗った。',
      new Date(y - 3, m, d, 20, 0),
      new Date(y - 3, m, d, 20, 10),
      [],
    ),
  ];
};

/**
 * 開発時に Supabase 環境変数が未設定の場合に使用するインメモリリポジトリ。
 * サーバープロセスが生きている間データを保持する（再起動でリセット）。
 * 本番環境では使用しないこと。
 */
export class InMemoryDiaryRepository implements DiaryRepository {
  private entries: Map<string, DiaryEntry>;

  constructor() {
    this.entries = new Map();
    for (const entry of createMockEntries()) {
      this.entries.set(entry.id, entry);
    }
  }

  async save(entry: DiaryEntry): Promise<void> {
    const dateKey = toDateKey(entry.date);
    const duplicate = [...this.entries.values()].find(
      (e) => toDateKey(e.date) === dateKey && e.id !== entry.id,
    );
    if (duplicate) {
      throw new DuplicateDateEntryError('An entry for this date already exists');
    }
    this.entries.set(entry.id, entry);
  }

  async findById(id: string): Promise<DiaryEntry | null> {
    return this.entries.get(id) ?? null;
  }

  async findByDate(date: Date): Promise<DiaryEntry | null> {
    const dateKey = toDateKey(date);
    return [...this.entries.values()].find((e) => toDateKey(e.date) === dateKey) ?? null;
  }

  async findBySameDate(date: Date, years: number = 5): Promise<DiaryEntry[]> {
    const month = date.getMonth();
    const day = date.getDate();
    const currentYear = date.getFullYear();
    const minYear = currentYear - years;

    return [...this.entries.values()]
      .filter((e) => {
        const y = e.date.getFullYear();
        return (
          e.date.getMonth() === month && e.date.getDate() === day && y < currentYear && y >= minYear
        );
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async delete(id: string): Promise<void> {
    if (!this.entries.has(id)) {
      throw new NotFoundError(`Entry not found: ${id}`);
    }
    this.entries.delete(id);
  }

  async findAll(): Promise<DiaryEntry[]> {
    return [...this.entries.values()];
  }
}
