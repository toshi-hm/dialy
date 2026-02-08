# Domain Driven Development (DDD) Rules

ドメイン駆動開発（DDD）の原則に従い、ビジネスロジックをドメイン層に集約します。

## DDDの核心概念

### 1. ユビキタス言語（Ubiquitous Language）

ビジネスの用語をコードに反映させる。

```typescript
// ❌ Bad - 技術的な用語
type Record = {
  id: string;
  text: string;
  timestamp: number;
};

class RecordManager {
  create(data: any) { /* ... */ }
  update(data: any) { /* ... */ }
}

// ✅ Good - ビジネスドメインの用語
type DiaryEntry = {
  id: string;
  content: string;
  writtenAt: Date;
};

class DiaryService {
  writeEntry(content: string): DiaryEntry { /* ... */ }
  reviseEntry(entryId: string, newContent: string): DiaryEntry { /* ... */ }
}
```

### 2. ドメインモデル（Domain Model）

ビジネスロジックをエンティティと値オブジェクトで表現。

#### エンティティ（Entity）

同一性（ID）を持つオブジェクト。

```typescript
// src/lib/domain/diary-entry.ts
export class DiaryEntry {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly writtenAt: Date,
    public readonly tags: string[],
  ) {
    this.validate();
  }

  // ファクトリーメソッド
  static create(title: string, content: string, tags: string[] = []): DiaryEntry {
    return new DiaryEntry(
      crypto.randomUUID(),
      title,
      content,
      new Date(),
      tags,
    );
  }

  static reconstruct(
    id: string,
    title: string,
    content: string,
    writtenAt: Date,
    tags: string[],
  ): DiaryEntry {
    return new DiaryEntry(id, title, content, writtenAt, tags);
  }

  // ビジネスルール
  private validate(): void {
    if (this.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (this.content.length > 10000) {
      throw new Error('Content exceeds maximum length');
    }
  }

  // ドメイン操作
  revise(newContent: string): DiaryEntry {
    return new DiaryEntry(
      this.id,
      this.title,
      newContent,
      this.writtenAt,
      this.tags,
    );
  }

  addTag(tag: string): DiaryEntry {
    if (this.tags.includes(tag)) {
      return this;
    }
    return new DiaryEntry(
      this.id,
      this.title,
      this.content,
      this.writtenAt,
      [...this.tags, tag],
    );
  }

  // ドメインロジック
  isWrittenInSameMonth(date: Date): boolean {
    return (
      this.writtenAt.getFullYear() === date.getFullYear() &&
      this.writtenAt.getMonth() === date.getMonth()
    );
  }

  daysSinceWritten(): number {
    const diff = Date.now() - this.writtenAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
```

#### 値オブジェクト（Value Object）

同一性を持たず、値そのものが重要なオブジェクト。不変（immutable）。

```typescript
// src/lib/domain/date-range.ts
export class DateRange {
  private constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {
    if (start > end) {
      throw new Error('Start date must be before end date');
    }
  }

  static create(start: Date, end: Date): DateRange {
    return new DateRange(start, end);
  }

  static thisMonth(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return new DateRange(start, end);
  }

  static lastMonth(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return new DateRange(start, end);
  }

  includes(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }

  durationInDays(): number {
    const diff = this.end.getTime() - this.start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  equals(other: DateRange): boolean {
    return (
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime()
    );
  }
}
```

### 3. 集約（Aggregate）

関連するエンティティと値オブジェクトをまとめる境界。

```typescript
// src/lib/domain/diary.ts
export class Diary {
  private constructor(
    public readonly id: string,
    public readonly ownerId: string,
    private entries: DiaryEntry[],
  ) {}

  static create(ownerId: string): Diary {
    return new Diary(crypto.randomUUID(), ownerId, []);
  }

  // 集約ルート経由でのみエントリーを追加
  addEntry(title: string, content: string, tags: string[] = []): DiaryEntry {
    const entry = DiaryEntry.create(title, content, tags);

    // ビジネスルール: 1日1エントリーまで
    const today = new Date();
    const hasEntryToday = this.entries.some((e) => {
      const writtenDate = e.writtenAt;
      return (
        writtenDate.getDate() === today.getDate() &&
        writtenDate.getMonth() === today.getMonth() &&
        writtenDate.getFullYear() === today.getFullYear()
      );
    });

    if (hasEntryToday) {
      throw new Error('You can only write one entry per day');
    }

    this.entries.push(entry);
    return entry;
  }

  getEntriesInRange(range: DateRange): DiaryEntry[] {
    return this.entries.filter((entry) => range.includes(entry.writtenAt));
  }

  getEntriesByTag(tag: string): DiaryEntry[] {
    return this.entries.filter((entry) => entry.tags.includes(tag));
  }

  getTotalEntries(): number {
    return this.entries.length;
  }
}
```

### 4. リポジトリ（Repository）

集約の永続化を抽象化。

```typescript
// src/lib/domain/interfaces/diary-repository.ts
export type DiaryRepository = {
  save(diary: Diary): Promise<void>;
  findById(id: string): Promise<Diary | null>;
  findByOwnerId(ownerId: string): Promise<Diary | null>;
};
```

```typescript
// src/lib/infrastructure/prisma-diary-repository.ts
import { PrismaClient } from '@prisma/client';
import type { Diary } from '@/lib/domain/diary';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';

export class PrismaDiaryRepository implements DiaryRepository {
  constructor(private prisma: PrismaClient) {}

  async save(diary: Diary): Promise<void> {
    await this.prisma.diary.upsert({
      where: { id: diary.id },
      create: {
        id: diary.id,
        ownerId: diary.ownerId,
      },
      update: {
        ownerId: diary.ownerId,
      },
    });

    // エントリーも保存
    // （実装の詳細は省略）
  }

  async findByOwnerId(ownerId: string): Promise<Diary | null> {
    const data = await this.prisma.diary.findUnique({
      where: { ownerId },
      include: { entries: true },
    });

    if (!data) return null;

    // データベースのデータからドメインモデルを再構築
    return Diary.reconstruct(
      data.id,
      data.ownerId,
      data.entries.map((e) =>
        DiaryEntry.reconstruct(e.id, e.title, e.content, e.writtenAt, e.tags)
      ),
    );
  }

  async findById(id: string): Promise<Diary | null> {
    // 実装
  }
}
```

### 5. ドメインサービス（Domain Service）

複数のエンティティにまたがるロジック。

```typescript
// src/lib/domain/services/diary-statistics.ts
export class DiaryStatisticsService {
  calculateWritingStreak(entries: DiaryEntry[]): number {
    if (entries.length === 0) return 0;

    // エントリーを日付順にソート
    const sorted = entries
      .slice()
      .sort((a, b) => b.writtenAt.getTime() - a.writtenAt.getTime());

    let streak = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i].writtenAt;
      const next = sorted[i + 1].writtenAt;

      const diffDays = Math.floor(
        (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  findMostUsedTags(entries: DiaryEntry[], limit: number = 10): string[] {
    const tagCounts = new Map<string, number>();

    entries.forEach((entry) => {
      entry.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }
}
```

### 6. ドメインイベント（Domain Event）

ドメイン内で発生した重要な出来事を表現。

```typescript
// src/lib/domain/events/diary-entry-created.ts
export class DiaryEntryCreated {
  constructor(
    public readonly entryId: string,
    public readonly ownerId: string,
    public readonly title: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

```typescript
// src/lib/domain/diary.ts
export class Diary {
  private events: DiaryEntryCreated[] = [];

  addEntry(title: string, content: string, tags: string[] = []): DiaryEntry {
    const entry = DiaryEntry.create(title, content, tags);

    // ビジネスルールのチェック
    // ...

    this.entries.push(entry);

    // ドメインイベントを記録
    this.events.push(
      new DiaryEntryCreated(entry.id, this.ownerId, entry.title),
    );

    return entry;
  }

  getEvents(): DiaryEntryCreated[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }
}
```

## レイヤー構造とDDD

```
src/lib/
├── domain/                    # ドメイン層
│   ├── diary.ts              # 集約ルート
│   ├── diary-entry.ts        # エンティティ
│   ├── date-range.ts         # 値オブジェクト
│   ├── events/               # ドメインイベント
│   │   └── diary-entry-created.ts
│   ├── services/             # ドメインサービス
│   │   └── diary-statistics.ts
│   └── interfaces/           # リポジトリインターフェース
│       └── diary-repository.ts
├── use-cases/                # アプリケーション層
│   ├── create-diary-entry.ts
│   └── get-diary-statistics.ts
└── infrastructure/           # インフラ層
    └── prisma-diary-repository.ts
```

## ユースケース（Application Layer）

ドメインロジックを組み合わせてビジネスフローを実現。

```typescript
// src/lib/use-cases/create-diary-entry.ts
import type { Diary } from '@/lib/domain/diary';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';

export class CreateDiaryEntryUseCase {
  constructor(private diaryRepository: DiaryRepository) {}

  async execute(input: {
    ownerId: string;
    title: string;
    content: string;
    tags?: string[];
  }): Promise<{ entryId: string }> {
    // 1. 日記を取得（なければ作成）
    let diary = await this.diaryRepository.findByOwnerId(input.ownerId);

    if (!diary) {
      diary = Diary.create(input.ownerId);
    }

    // 2. ドメインロジックでエントリーを追加
    const entry = diary.addEntry(input.title, input.content, input.tags);

    // 3. 永続化
    await this.diaryRepository.save(diary);

    // 4. ドメインイベントの処理（例: 通知送信）
    const events = diary.getEvents();
    // イベントハンドラーに委譲...

    return { entryId: entry.id };
  }
}
```

## DDDのベストプラクティス

### 1. ドメインロジックはドメイン層に

```typescript
// ❌ Bad - ユースケースにビジネスロジック
export class CreateDiaryEntryUseCase {
  async execute(input: CreateDiaryEntryInput) {
    if (input.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (input.content.length > 10000) {
      throw new Error('Content too long');
    }
    // ...
  }
}

// ✅ Good - ドメインエンティティにビジネスロジック
export class DiaryEntry {
  private validate() {
    if (this.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (this.content.length > 10000) {
      throw new Error('Content too long');
    }
  }
}
```

### 2. 不変性（Immutability）を保つ

```typescript
// ❌ Bad - ミュータブル
export class DiaryEntry {
  public title: string;
  public content: string;

  updateContent(newContent: string) {
    this.content = newContent; // 状態を直接変更
  }
}

// ✅ Good - イミュータブル
export class DiaryEntry {
  public readonly title: string;
  public readonly content: string;

  revise(newContent: string): DiaryEntry {
    return new DiaryEntry(this.id, this.title, newContent, this.writtenAt, this.tags);
  }
}
```

### 3. 集約境界を守る

```typescript
// ❌ Bad - 集約外から内部を直接操作
const diary = await repository.findById(id);
const entry = diary.entries[0]; // 内部配列に直接アクセス
entry.content = 'new content'; // 直接変更

// ✅ Good - 集約ルート経由で操作
const diary = await repository.findById(id);
const updatedEntry = diary.reviseEntry(entryId, 'new content');
await repository.save(diary);
```

### 4. リポジトリは集約単位

```typescript
// ❌ Bad - エンティティごとにリポジトリ
type DiaryEntryRepository = {
  save(entry: DiaryEntry): Promise<void>;
  findById(id: string): Promise<DiaryEntry>;
};

// ✅ Good - 集約ルート単位でリポジトリ
type DiaryRepository = {
  save(diary: Diary): Promise<void>;
  findById(id: string): Promise<Diary>;
};
```

## テスト戦略

### ドメインモデルのテスト

```typescript
// diary-entry.test.ts
import { describe, test, expect } from 'vitest';
import { DiaryEntry } from './diary-entry';

describe('DiaryEntry', () => {
  test('creates valid diary entry', () => {
    const entry = DiaryEntry.create('Title', 'Content');
    expect(entry.id).toBeDefined();
    expect(entry.title).toBe('Title');
  });

  test('throws error for empty title', () => {
    expect(() => DiaryEntry.create('', 'Content')).toThrow(
      'Title cannot be empty',
    );
  });

  test('adds tag correctly', () => {
    const entry = DiaryEntry.create('Title', 'Content');
    const updated = entry.addTag('personal');
    expect(updated.tags).toContain('personal');
  });

  test('does not add duplicate tag', () => {
    const entry = DiaryEntry.create('Title', 'Content', ['personal']);
    const updated = entry.addTag('personal');
    expect(updated.tags).toEqual(['personal']);
  });
});
```

## まとめ

DDDは複雑なビジネスロジックを整理し、保守しやすいコードを実現します:

1. **ユビキタス言語**: ビジネス用語をコードに反映
2. **ドメインモデル**: ビジネスルールをエンティティと値オブジェクトで表現
3. **集約**: 関連するオブジェクトの境界を定義
4. **リポジトリ**: 永続化の詳細を隠蔽
5. **ドメインサービス**: 複数エンティティにまたがるロジック
6. **ドメインイベント**: ドメイン内の重要な出来事を表現

**重要**: DDDはすべてのプロジェクトに必要ではありません。ビジネスロジックが複雑な場合に適用し、シンプルなCRUDアプリには過剰です。
