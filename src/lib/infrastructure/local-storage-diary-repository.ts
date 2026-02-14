import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { parseISODate, toISODate } from '@/lib/utils/date';
import type { DiaryStorage, StoredDiaryEntry } from '@/types/diary';
import { DuplicateDateEntryError } from '@/types/errors';

export const STORAGE_KEY = 'dialy_entries';
export const STORAGE_VERSION = '1.0.0';

const createEmptyStorage = (): DiaryStorage => {
  return {
    version: STORAGE_VERSION,
    entries: [],
  };
};

const isStoredDiaryEntry = (value: unknown): value is StoredDiaryEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredDiaryEntry>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.content === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
};

const isDiaryStorage = (value: unknown): value is DiaryStorage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<DiaryStorage>;
  return (
    typeof candidate.version === 'string' &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every((entry) => isStoredDiaryEntry(entry))
  );
};

export class LocalStorageDiaryRepository implements DiaryRepository {
  private cache: DiaryStorage | null = null;
  private readonly storage: Storage | null;

  constructor(
    storage: Storage | null = typeof window === 'undefined' ? null : window.localStorage,
  ) {
    this.storage = storage;
  }

  async save(entry: DiaryEntry): Promise<void> {
    const storage = this.getStorage();
    const date = toISODate(entry.date);

    const duplicateEntry = storage.entries.find(
      (stored) => stored.date === date && stored.id !== entry.id,
    );

    if (duplicateEntry) {
      throw new DuplicateDateEntryError('An entry for this date already exists');
    }

    const targetIndex = storage.entries.findIndex((stored) => stored.id === entry.id);
    const serialized = this.serialize(entry);

    if (targetIndex >= 0) {
      storage.entries[targetIndex] = serialized;
    } else {
      storage.entries.push(serialized);
    }

    this.persistStorage(storage);
  }

  async findById(id: string): Promise<DiaryEntry | null> {
    const storage = this.getStorage();
    const found = storage.entries.find((entry) => entry.id === id);

    return found ? this.deserialize(found) : null;
  }

  async findByDate(date: Date): Promise<DiaryEntry | null> {
    const storage = this.getStorage();
    const targetDate = toISODate(date);
    const found = storage.entries.find((entry) => entry.date === targetDate);

    return found ? this.deserialize(found) : null;
  }

  async findBySameDate(date: Date, years: number = 5): Promise<DiaryEntry[]> {
    const storage = this.getStorage();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const currentYear = date.getFullYear();
    const minYear = currentYear - years;

    return storage.entries
      .map((entry) => this.deserialize(entry))
      .filter((entry) => {
        const entryYear = entry.date.getFullYear();
        return (
          entry.date.getMonth() + 1 === month &&
          entry.date.getDate() === day &&
          entryYear < currentYear &&
          entryYear >= minYear
        );
      })
      .sort((left, right) => right.date.getTime() - left.date.getTime());
  }

  async delete(id: string): Promise<void> {
    const storage = this.getStorage();
    storage.entries = storage.entries.filter((entry) => entry.id !== id);
    this.persistStorage(storage);
  }

  async findAll(): Promise<DiaryEntry[]> {
    return this.getStorage().entries.map((entry) => this.deserialize(entry));
  }

  invalidateCache(): void {
    this.cache = null;
  }

  protected migrateStorage(storage: DiaryStorage): DiaryStorage {
    return {
      version: STORAGE_VERSION,
      entries: storage.entries,
    };
  }

  private getStorage(): DiaryStorage {
    if (this.cache) {
      return this.cache;
    }

    if (!this.storage) {
      this.cache = createEmptyStorage();
      return this.cache;
    }

    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) {
      this.cache = createEmptyStorage();
      return this.cache;
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (!isDiaryStorage(parsed)) {
        this.cache = createEmptyStorage();
        return this.cache;
      }

      const checked = this.checkStorageVersion(parsed);
      this.cache = checked;
      return this.cache;
    } catch {
      this.cache = createEmptyStorage();
      return this.cache;
    }
  }

  private checkStorageVersion(storage: DiaryStorage): DiaryStorage {
    if (storage.version === STORAGE_VERSION) {
      return storage;
    }

    const migrated = this.migrateStorage(storage);
    this.persistStorage(migrated);
    return migrated;
  }

  private persistStorage(storage: DiaryStorage): void {
    this.cache = storage;

    if (!this.storage) {
      return;
    }

    this.storage.setItem(STORAGE_KEY, JSON.stringify(storage));
  }

  private serialize(entry: DiaryEntry): StoredDiaryEntry {
    return {
      id: entry.id,
      date: toISODate(entry.date),
      content: entry.content,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  private deserialize(entry: StoredDiaryEntry): DiaryEntry {
    return DiaryEntry.reconstruct(
      entry.id,
      parseISODate(entry.date),
      entry.content,
      new Date(entry.createdAt),
      new Date(entry.updatedAt),
    );
  }
}
