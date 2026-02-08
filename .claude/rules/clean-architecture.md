---
paths:
  - "src/**/*.{ts,tsx}"
---

# Clean Architecture Principles

このプロジェクトはClean Architectureの原則に従い、関心の分離と保守性を確保します。

## レイヤー構造

```
src/
├── app/                  # Presentation Layer (Next.js App Router)
├── components/           # Presentation Layer (UI Components)
├── lib/
│   ├── domain/          # Domain Layer (Business Entities)
│   ├── use-cases/       # Application Layer (Use Cases)
│   ├── validations/     # Domain validation schemas
│   └── utils/           # Infrastructure utilities
```

## 依存関係ルール

**The Dependency Rule**: 依存は常に内側（ドメイン）に向かう

```
Presentation → Application → Domain
    ↓              ↓           ↓
  (外側)        (中間)      (内側)
```

### Domain Layer (最内層)

**責務**: ビジネスロジックとエンティティの定義

**特徴**:
- フレームワークに依存しない
- データベースやUIに依存しない
- 純粋なTypeScript/JavaScript

**配置**: `src/lib/domain/`

```typescript
// src/lib/domain/diary.ts
export type Diary = {
  id: string;
  title: string;
  content: string;
  date: Date;
};

export class DiaryEntry {
  constructor(
    private readonly id: string,
    private readonly title: string,
    private readonly content: string,
    private readonly date: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.length === 0) {
      throw new Error('Title is required');
    }
    if (this.content.length > 10000) {
      throw new Error('Content too long');
    }
  }

  // ビジネスルールをメソッドとして実装
  isOlderThan(days: number): boolean {
    const diff = Date.now() - this.date.getTime();
    return diff > days * 24 * 60 * 60 * 1000;
  }
}
```

**許可**:
- ✅ 他のドメインエンティティ
- ✅ Zodなどのバリデーションライブラリ
- ✅ 型定義とインターフェース

**禁止**:
- ❌ React、Next.jsなどのフレームワーク
- ❌ データベースクライアント
- ❌ 外部API呼び出し
- ❌ UIコンポーネント

### Application Layer (中間層)

**責務**: ユースケースの実装とビジネスフローの調整

**特徴**:
- ドメインロジックを組み合わせる
- インフラストラクチャの詳細を知らない
- フレームワークに依存しない（可能な限り）

**配置**: `src/lib/use-cases/` または `src/app/*/actions/`

```typescript
// src/lib/use-cases/create-diary-entry.ts
import { DiaryEntry } from '@/lib/domain/diary';
import type { DiaryRepository } from '@/lib/interfaces/diary-repository';

export class CreateDiaryEntryUseCase {
  constructor(private repository: DiaryRepository) {}

  async execute(input: {
    title: string;
    content: string;
    date: Date;
  }): Promise<DiaryEntry> {
    // 1. ドメインエンティティを作成（バリデーション含む）
    const entry = new DiaryEntry(
      crypto.randomUUID(),
      input.title,
      input.content,
      input.date,
    );

    // 2. リポジトリを通じて永続化
    await this.repository.save(entry);

    return entry;
  }
}
```

**許可**:
- ✅ ドメインエンティティ
- ✅ リポジトリインターフェース（抽象）
- ✅ サービスインターフェース（抽象）

**禁止**:
- ❌ 具体的なデータベース実装
- ❌ UIコンポーネント
- ❌ Next.js固有のAPI（可能な限り）

### Presentation Layer (最外層)

**責務**: ユーザーインターフェースとフレームワーク統合

**配置**: `src/app/`, `src/components/`

```typescript
// src/app/diary/actions.ts (Next.js Server Actions)
'use server';

import { createDiaryEntryUseCase } from '@/lib/use-cases/create-diary-entry';
import { prismaRepository } from '@/lib/infrastructure/prisma-repository';

export async function createDiaryAction(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  const useCase = new CreateDiaryEntryUseCase(prismaRepository);

  try {
    await useCase.execute({
      title,
      content,
      date: new Date(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**許可**:
- ✅ すべての層へのアクセス
- ✅ フレームワーク固有のAPI
- ✅ UIライブラリ

## 型エイリアスとDI（依存性の注入）

### リポジトリパターン

```typescript
// src/lib/interfaces/diary-repository.ts (抽象)
export type DiaryRepository = {
  save(entry: DiaryEntry): Promise<void>;
  findById(id: string): Promise<DiaryEntry | null>;
  findByDateRange(start: Date, end: Date): Promise<DiaryEntry[]>;
};

// src/lib/infrastructure/prisma-diary-repository.ts (具体実装)
import { PrismaClient } from '@prisma/client';
import type { DiaryRepository } from '@/lib/interfaces/diary-repository';

export class PrismaDiaryRepository implements DiaryRepository {
  constructor(private prisma: PrismaClient) {}

  async save(entry: DiaryEntry): Promise<void> {
    await this.prisma.diary.create({
      data: {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        date: entry.date,
      },
    });
  }

  // ... 他のメソッド
}
```

### 依存性の注入

```typescript
// ❌ Bad - 具象クラスに直接依存
export class CreateDiaryEntryUseCase {
  private repository = new PrismaDiaryRepository(new PrismaClient());
}

// ✅ Good - 抽象型に依存、実装は外部から注入
export class CreateDiaryEntryUseCase {
  constructor(private repository: DiaryRepository) {}
}

// 使用時に具体的な実装を注入
const useCase = new CreateDiaryEntryUseCase(
  new PrismaDiaryRepository(prisma)
);
```

## バリデーション戦略

### ドメインレベルのバリデーション

```typescript
// src/lib/validations/diary.ts
import { z } from 'zod';

export const DiaryEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().max(10000, 'Content too long'),
  date: z.date(),
});

export type DiaryEntryInput = z.infer<typeof DiaryEntrySchema>;
```

### プレゼンテーション層でのバリデーション

```typescript
// src/app/diary/new/page.tsx
'use client';

import { DiaryEntrySchema } from '@/lib/validations/diary';

export default function NewDiaryPage() {
  const handleSubmit = (formData: FormData) => {
    const input = {
      title: formData.get('title'),
      content: formData.get('content'),
      date: new Date(),
    };

    // プレゼンテーション層でバリデーション
    const result = DiaryEntrySchema.safeParse(input);

    if (!result.success) {
      // UIにエラー表示
      return;
    }

    // バリデーション済みデータをユースケースに渡す
    createDiaryAction(result.data);
  };
}
```

## フォルダ構造例

```
src/
├── app/                           # Presentation: Next.js App Router
│   ├── diary/
│   │   ├── [id]/page.tsx         # ページコンポーネント
│   │   ├── new/page.tsx
│   │   └── actions.ts            # Server Actions（Application層との橋渡し）
│   └── layout.tsx
├── components/                    # Presentation: UIコンポーネント
│   ├── atoms/
│   ├── molecules/
│   └── organisms/
├── lib/
│   ├── domain/                   # Domain: ビジネスエンティティ
│   │   ├── diary.ts
│   │   └── user.ts
│   ├── use-cases/                # Application: ユースケース
│   │   ├── create-diary-entry.ts
│   │   └── find-diaries-by-date.ts
│   ├── interfaces/               # Application: インターフェース定義
│   │   └── diary-repository.ts
│   ├── infrastructure/           # Infrastructure: 具体実装
│   │   ├── prisma-diary-repository.ts
│   │   └── api-client.ts
│   ├── validations/              # Domain: バリデーションスキーマ
│   │   └── diary.ts
│   └── utils/                    # Infrastructure: ユーティリティ
│       └── date.ts
```

## テスト戦略

### Domain Layer のテスト

```typescript
// src/lib/domain/diary.test.ts
import { describe, test, expect } from 'vitest';
import { DiaryEntry } from './diary';

describe('DiaryEntry', () => {
  test('should create valid diary entry', () => {
    const entry = new DiaryEntry(
      'id',
      'Test Title',
      'Test Content',
      new Date()
    );
    expect(entry).toBeDefined();
  });

  test('should throw error for empty title', () => {
    expect(() => {
      new DiaryEntry('id', '', 'Content', new Date());
    }).toThrow('Title is required');
  });
});
```

### Application Layer のテスト（モックを使用）

```typescript
// src/lib/use-cases/create-diary-entry.test.ts
import { describe, test, expect, vi } from 'vitest';
import { CreateDiaryEntryUseCase } from './create-diary-entry';

describe('CreateDiaryEntryUseCase', () => {
  test('should save diary entry via repository', async () => {
    const mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByDateRange: vi.fn(),
    };

    const useCase = new CreateDiaryEntryUseCase(mockRepository);

    await useCase.execute({
      title: 'Test',
      content: 'Content',
      date: new Date(),
    });

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
```

## ベストプラクティス

1. **ビジネスロジックはドメイン層に**: UIやデータベースの詳細から独立
2. **インターフェースで抽象化**: 実装の詳細を隠蔽
3. **DIで疎結合を実現**: テスタビリティと保守性の向上
4. **各層の責務を明確に**: レイヤー間の境界を守る
5. **フレームワークに依存しないコア**: Next.jsからの移行を容易に

## 移行ガイドライン

既存コードをClean Architectureに移行する場合:

1. **ドメインモデルを抽出**: ビジネスロジックを識別し、ドメイン層に移動
2. **リポジトリパターンを導入**: データアクセスを抽象化
3. **ユースケースを作成**: ビジネスフローを明確化
4. **段階的にリファクタリング**: 一度にすべてを変更しない

**重要**: 既存コードが完全にClean Architectureに従っていなくても問題ありません。新しいコードから徐々に原則を適用していきましょう。
