# データモデル設計

## 目次
- [1. エンティティ定義](#1-エンティティ定義)
- [2. 値オブジェクト定義](#2-値オブジェクト定義)
- [3. データベーススキーマ（将来）](#3-データベーススキーマ将来)
- [4. MVP版データ構造（LocalStorage）](#4-mvp版データ構造localstorage)
- [5. バリデーションルール](#5-バリデーションルール)
- [6. データ操作インターフェース](#6-データ操作インターフェース)

## 1. エンティティ定義

### 1.1 DiaryEntry（日記エントリー）

日記の1つの記録を表すエンティティ。

#### プロパティ

| プロパティ | 型 | 必須 | 説明 | 制約 |
|-----------|---|------|------|------|
| id | string | ✓ | 一意識別子 | UUID v4形式 |
| date | Date | ✓ | 日記の日付 | 未来の日付は不可 |
| content | string | ✓ | 日記の本文 | 最大10,000文字 |
| createdAt | Date | ✓ | 作成日時 | 自動生成 |
| updatedAt | Date | ✓ | 更新日時 | 自動更新 |

#### TypeScript型定義

```typescript
// src/lib/domain/diary-entry.ts
export class DiaryEntry {
  private constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  // ファクトリーメソッド: 新規作成
  static create(date: Date, content: string): DiaryEntry {
    return new DiaryEntry(
      crypto.randomUUID(),
      date,
      content,
      new Date(),
      new Date(),
    );
  }

  // ファクトリーメソッド: データベースから復元
  static reconstruct(
    id: string,
    date: Date,
    content: string,
    createdAt: Date,
    updatedAt: Date,
  ): DiaryEntry {
    return new DiaryEntry(id, date, content, createdAt, updatedAt);
  }

  // バリデーション
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('ID is required');
    }

    if (this.date > new Date()) {
      throw new Error('Future date is not allowed');
    }

    if (this.content.length > 10000) {
      throw new Error('Content exceeds maximum length (10,000 characters)');
    }
  }

  // ドメインロジック: 内容更新
  update(newContent: string): DiaryEntry {
    return new DiaryEntry(
      this.id,
      this.date,
      newContent,
      this.createdAt,
      new Date(), // updatedAtを現在時刻に更新
    );
  }

  // ドメインロジック: 同じ日かどうか判定
  isSameDate(other: Date): boolean {
    return (
      this.date.getFullYear() === other.getFullYear() &&
      this.date.getMonth() === other.getMonth() &&
      this.date.getDate() === other.getDate()
    );
  }

  // ドメインロジック: 年の取得
  getYear(): number {
    return this.date.getFullYear();
  }

  // ドメインロジック: プレビューテキストの取得
  getPreviewText(maxLength: number = 100): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return `${this.content.substring(0, maxLength)}...`;
  }

  // ドメインロジック: 文字数の取得
  getCharacterCount(): number {
    return this.content.length;
  }
}
```

### 1.2 User（ユーザー）- 将来実装

マルチユーザー対応時に実装。

#### プロパティ

| プロパティ | 型 | 必須 | 説明 | 制約 |
|-----------|---|------|------|------|
| id | string | ✓ | 一意識別子 | UUID v4形式 |
| email | string | ✓ | メールアドレス | 一意、email形式 |
| name | string | ✓ | ユーザー名 | 最大50文字 |
| createdAt | Date | ✓ | 作成日時 | 自動生成 |

## 2. 値オブジェクト定義

### 2.1 DateValue（日付値オブジェクト）

日付を表す値オブジェクト。日付に関するロジックをカプセル化。

```typescript
// src/lib/domain/date-value.ts
export class DateValue {
  private constructor(private readonly value: Date) {
    this.validate();
  }

  static create(date: Date): DateValue {
    return new DateValue(new Date(date));
  }

  static today(): DateValue {
    return new DateValue(new Date());
  }

  private validate(): void {
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new Error('Invalid date');
    }
  }

  // 同じ月日かどうか判定（年は無視）
  isSameMonthAndDay(other: DateValue): boolean {
    return (
      this.value.getMonth() === other.value.getMonth() &&
      this.value.getDate() === other.value.getDate()
    );
  }

  // 過去N年分の同じ月日の日付を取得
  getSameDatesInPastYears(years: number): DateValue[] {
    const dates: DateValue[] = [];
    const currentYear = this.value.getFullYear();

    for (let i = 1; i <= years; i++) {
      const pastDate = new Date(this.value);
      pastDate.setFullYear(currentYear - i);
      dates.push(new DateValue(pastDate));
    }

    return dates;
  }

  // フォーマット: ◯月◯日（曜日）
  formatWithWeekday(): string {
    const month = this.value.getMonth() + 1;
    const day = this.value.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[this.value.getDay()];

    return `${month}月${day}日（${weekday}）`;
  }

  // フォーマット: YYYY-MM-DD
  formatISO(): string {
    return this.value.toISOString().split('T')[0];
  }

  // Date型を取得
  toDate(): Date {
    return new Date(this.value);
  }

  // 等価性判定
  equals(other: DateValue): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
```

## 3. データベーススキーマ（将来）

### 3.1 Prismaスキーマ

将来的にPrismaを導入する際のスキーマ定義。

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // または sqlite
  url      = env("DATABASE_URL")
}

// 日記エントリーテーブル
model DiaryEntry {
  id        String   @id @default(uuid())
  date      DateTime @db.Date
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  userId    String?  @map("user_id")  // 将来のマルチユーザー対応

  // リレーション（将来）
  user User? @relation(fields: [userId], references: [id])

  // インデックス
  @@index([date])
  @@index([userId])
  @@map("diary_entries")
}

// ユーザーテーブル（将来）
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")

  // リレーション
  entries DiaryEntry[]

  @@map("users")
}
```

### 3.2 テーブル定義

#### diary_entries テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|----------|------|
| id | UUID | NOT NULL | uuid_generate_v4() | 主キー |
| date | DATE | NOT NULL | - | 日記の日付 |
| content | TEXT | NOT NULL | - | 日記の本文 |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | now() | 更新日時 |
| user_id | UUID | NULL | - | ユーザーID（将来） |

**インデックス**:
- PRIMARY KEY: id
- INDEX: date
- INDEX: user_id（将来）

**制約**:
- date: 未来の日付は不可（アプリケーション層で制御）
- content: 最大10,000文字（アプリケーション層で制御）

#### users テーブル（将来）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|----------|------|
| id | UUID | NOT NULL | uuid_generate_v4() | 主キー |
| email | VARCHAR(255) | NOT NULL | - | メールアドレス |
| name | VARCHAR(50) | NOT NULL | - | ユーザー名 |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY: id
- UNIQUE: email

## 4. MVP版データ構造（LocalStorage）

### 4.1 LocalStorageキー

```typescript
const STORAGE_KEY = 'dialy_entries';
```

### 4.2 データ形式

```typescript
// LocalStorageに保存される形式
type StoredDiaryEntry = {
  id: string;
  date: string;  // ISO 8601形式: YYYY-MM-DD
  content: string;
  createdAt: string;  // ISO 8601形式: YYYY-MM-DDTHH:mm:ss.sssZ
  updatedAt: string;  // ISO 8601形式: YYYY-MM-DDTHH:mm:ss.sssZ
}

// LocalStorage全体のデータ構造
type DiaryStorage = {
  version: string;  // データバージョン（マイグレーション用）
  entries: StoredDiaryEntry[];
}
```

### 4.3 データ例

```json
{
  "version": "1.0.0",
  "entries": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-02-08",
      "content": "今日は設計書を作成した。過去の同じ日の日記を見ながら書けるアプリは面白そう。",
      "createdAt": "2026-02-08T10:30:00.000Z",
      "updatedAt": "2026-02-08T10:35:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "date": "2025-02-08",
      "content": "1年前の今日。まだこのアプリのアイデアはなかった。",
      "createdAt": "2025-02-08T09:00:00.000Z",
      "updatedAt": "2025-02-08T09:00:00.000Z"
    }
  ]
}
```

## 5. バリデーションルール

### 5.1 Zodスキーマ

```typescript
// src/lib/validations/diary.ts
import { z } from 'zod';

// 日記エントリーのバリデーションスキーマ
export const DiaryEntrySchema = z.object({
  date: z.date().refine(
    (date) => date <= new Date(),
    { message: 'Future date is not allowed' }
  ),
  content: z.string()
    .max(10000, 'Content exceeds maximum length (10,000 characters)'),
});

export type DiaryEntryInput = z.infer<typeof DiaryEntrySchema>;

// 日記エントリー作成のバリデーション
export const CreateDiaryEntrySchema = DiaryEntrySchema;

// 日記エントリー更新のバリデーション
export const UpdateDiaryEntrySchema = z.object({
  id: z.string().uuid(),
  content: z.string()
    .max(10000, 'Content exceeds maximum length (10,000 characters)'),
});

export type UpdateDiaryEntryInput = z.infer<typeof UpdateDiaryEntrySchema>;

// 日記エントリー削除のバリデーション
export const DeleteDiaryEntrySchema = z.object({
  id: z.string().uuid(),
});

export type DeleteDiaryEntryInput = z.infer<typeof DeleteDiaryEntrySchema>;
```

### 5.2 バリデーションエラーメッセージ

| フィールド | エラー条件 | メッセージ |
|----------|----------|----------|
| date | 未来の日付 | "Future date is not allowed" |
| content | 10,000文字超過 | "Content exceeds maximum length (10,000 characters)" |
| content | 空文字（将来的に必須にする場合） | "Content is required" |
| id | UUID形式でない | "Invalid ID format" |

## 6. データ操作インターフェース

### 6.1 DiaryRepositoryインターフェース

```typescript
// src/lib/domain/interfaces/diary-repository.ts
import type { DiaryEntry } from '@/lib/domain/diary-entry';

export type DiaryRepository = {
  /**
   * 日記エントリーを保存（作成または更新）
   */
  save(entry: DiaryEntry): Promise<void>;

  /**
   * IDで日記エントリーを取得
   */
  findById(id: string): Promise<DiaryEntry | null>;

  /**
   * 特定の日付の日記エントリーを取得
   */
  findByDate(date: Date): Promise<DiaryEntry | null>;

  /**
   * 特定の月日の過去N年分の日記エントリーを取得
   * @param date - 基準日
   * @param years - 過去何年分取得するか（デフォルト: 5）
   * @returns 新しい順にソートされた日記エントリー配列
   */
  findBySameDate(date: Date, years?: number): Promise<DiaryEntry[]>;

  /**
   * 日記エントリーを削除
   */
  delete(id: string): Promise<void>;

  /**
   * すべての日記エントリーを取得（将来の検索機能用）
   */
  findAll(): Promise<DiaryEntry[]>;
}
```

### 6.2 LocalStorageDiaryRepository実装（MVP版）

```typescript
// src/lib/infrastructure/local-storage-diary-repository.ts
import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';

const STORAGE_KEY = 'dialy_entries';
const STORAGE_VERSION = '1.0.0';

type StoredDiaryEntry = {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type DiaryStorage = {
  version: string;
  entries: StoredDiaryEntry[];
};

export class LocalStorageDiaryRepository implements DiaryRepository {
  private getStorage(): DiaryStorage {
    if (typeof window === 'undefined') {
      return { version: STORAGE_VERSION, entries: [] };
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { version: STORAGE_VERSION, entries: [] };
    }

    try {
      return JSON.parse(data);
    } catch {
      return { version: STORAGE_VERSION, entries: [] };
    }
  }

  private setStorage(storage: DiaryStorage): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  }

  async save(entry: DiaryEntry): Promise<void> {
    const storage = this.getStorage();
    const dateStr = entry.date.toISOString().split('T')[0];

    // 同じ日付の日記が既に存在するかチェック（更新時は除外）
    const existingIndex = storage.entries.findIndex(
      (e) => e.date === dateStr && e.id !== entry.id
    );

    if (existingIndex >= 0) {
      throw new Error('An entry for this date already exists');
    }

    const index = storage.entries.findIndex((e) => e.id === entry.id);

    const storedEntry: StoredDiaryEntry = {
      id: entry.id,
      date: dateStr,
      content: entry.content,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };

    if (index >= 0) {
      storage.entries[index] = storedEntry;
    } else {
      storage.entries.push(storedEntry);
    }

    this.setStorage(storage);
  }

  async findById(id: string): Promise<DiaryEntry | null> {
    const storage = this.getStorage();
    const stored = storage.entries.find((e) => e.id === id);

    if (!stored) return null;

    return DiaryEntry.reconstruct(
      stored.id,
      new Date(stored.date),
      stored.content,
      new Date(stored.createdAt),
      new Date(stored.updatedAt),
    );
  }

  async findByDate(date: Date): Promise<DiaryEntry | null> {
    const storage = this.getStorage();
    const dateStr = date.toISOString().split('T')[0];
    const stored = storage.entries.find((e) => e.date === dateStr);

    if (!stored) return null;

    return DiaryEntry.reconstruct(
      stored.id,
      new Date(stored.date),
      stored.content,
      new Date(stored.createdAt),
      new Date(stored.updatedAt),
    );
  }

  async findBySameDate(date: Date, years: number = 5): Promise<DiaryEntry[]> {
    const storage = this.getStorage();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const currentYear = date.getFullYear();

    const entries: DiaryEntry[] = [];

    for (let i = 1; i <= years; i++) {
      const targetYear = currentYear - i;
      const targetDate = `${targetYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const stored = storage.entries.find((e) => e.date === targetDate);
      if (stored) {
        entries.push(
          DiaryEntry.reconstruct(
            stored.id,
            new Date(stored.date),
            stored.content,
            new Date(stored.createdAt),
            new Date(stored.updatedAt),
          )
        );
      }
    }

    // 新しい順にソート
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async delete(id: string): Promise<void> {
    const storage = this.getStorage();
    storage.entries = storage.entries.filter((e) => e.id !== id);
    this.setStorage(storage);
  }

  async findAll(): Promise<DiaryEntry[]> {
    const storage = this.getStorage();
    return storage.entries.map((stored) =>
      DiaryEntry.reconstruct(
        stored.id,
        new Date(stored.date),
        stored.content,
        new Date(stored.createdAt),
        new Date(stored.updatedAt),
      )
    );
  }
}
```

## 7. データマイグレーション戦略

### 7.1 LocalStorage → Prisma移行

将来的にPrismaを導入する際のマイグレーション戦略。

```typescript
// 移行スクリプト例
export async function migrateFromLocalStorage(prisma: PrismaClient) {
  const storage = JSON.parse(localStorage.getItem('dialy_entries') || '{}');

  for (const entry of storage.entries || []) {
    await prisma.diaryEntry.create({
      data: {
        id: entry.id,
        date: new Date(entry.date),
        content: entry.content,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      },
    });
  }

  console.log(`Migrated ${storage.entries.length} entries`);
}
```

### 7.2 データバージョン管理

LocalStorageにバージョン情報を保存し、将来的なデータ構造変更に対応。

```typescript
type DiaryStorage = {
  version: string;  // "1.0.0"
  entries: StoredDiaryEntry[];
}

// バージョンチェック
function checkStorageVersion(storage: DiaryStorage): DiaryStorage {
  if (storage.version !== STORAGE_VERSION) {
    // マイグレーション処理
    return migrateStorage(storage);
  }
  return storage;
}
```

## 8. データ整合性保証

### 8.1 一意性制約

- **ID**: UUID v4で一意性を保証
- **date**: 同じ日付に複数の日記は作成不可（アプリケーション層で制御）

### 8.2 整合性チェック

```typescript
// 同じ日付の日記が既に存在するかチェック
async function ensureUniqueDateEntry(
  repository: DiaryRepository,
  date: Date,
  excludeId?: string
): Promise<void> {
  const existing = await repository.findByDate(date);

  if (existing && existing.id !== excludeId) {
    throw new Error('An entry for this date already exists');
  }
}
```

## 9. パフォーマンス考慮事項

### 9.1 LocalStorage版

- **読み込み**: すべてのデータを一度に読み込み、メモリ上でフィルタリング
- **書き込み**: デバウンス処理で書き込み頻度を制限
- **制限**: 5MB程度が上限（ブラウザによる）

### 9.2 Prisma版（将来）

- **インデックス**: dateカラムにインデックスを作成
- **クエリ最適化**: 必要なフィールドのみ取得
- **ページネーション**: 大量データ対応

## 10. まとめ

- **エンティティ**: DiaryEntry（日記エントリー）
- **値オブジェクト**: DateValue（日付）
- **MVP版**: LocalStorageで実装
- **将来**: Prisma + PostgreSQLに移行
- **バリデーション**: Zodスキーマで型安全性を確保
- **リポジトリパターン**: データ永続化の抽象化
