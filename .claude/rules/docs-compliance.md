# Documentation Compliance Rule

このプロジェクトでは、`docs/`配下の設計書に厳密に従って開発を進めます。

## 原則

1. **設計書ファーストアプローチ**: 実装前に必ず該当する設計書を確認
2. **設計書との整合性**: 設計書に記載されていない実装は行わない
3. **変更時の設計書更新**: 仕様変更時は設計書を先に更新
4. **MVP版の尊重**: MVP版とPhase 2の区別を厳守

---

## 開発前の確認事項

### ステップ1: 該当する設計書を特定

実装する機能に応じて、以下の設計書を確認:

| 実装内容 | 参照すべき設計書 |
|---------|----------------|
| 新機能の追加 | 01_REQUIREMENTS.md → 05_FEATURES.md |
| UIコンポーネント | 04_UI_UX_DESIGN.md → .claude/rules/atomic-design.md |
| データモデル | 03_DATA_MODEL.md → .claude/rules/ddd.md |
| アーキテクチャ | 02_ARCHITECTURE.md → .claude/rules/clean-architecture.md |
| セキュリティ | 06_SECURITY.md |
| パフォーマンス | 07_PERFORMANCE.md |

### ステップ2: 設計書の内容を理解

```bash
# 設計書を確認するスキルを使用
/review-docs <機能名>
```

### ステップ3: MVP版かPhase 2かを確認

**MVP版の特徴**:
- LocalStorageのみ
- Client Componentsのみ（'use client'）
- 認証なし
- 自動保存のみ（保存ボタンなし）
- カレンダーUIによる日付選択（Dialは補助）

**Phase 2の特徴**:
- Prisma + PostgreSQL
- Server Components + Server Actions
- NextAuth.js認証
- マルチユーザー対応

---

## 実装時の厳守事項

### 1. データ保存（MVP版）

```typescript
// ✅ Good - LocalStorageを使用
import { LocalStorageDiaryRepository } from '@/lib/infrastructure/local-storage-diary-repository';

const repository = new LocalStorageDiaryRepository();
await repository.save(entry);

// ❌ Bad - Server ActionsやPrismaは使わない（MVP版）
import { createDiaryAction } from '@/app/actions/diary';
await createDiaryAction(formData);
```

### 2. コンポーネント設計（MVP版）

```typescript
// ✅ Good - Client Component
'use client';

import { useState, useEffect } from 'react';

export default function DiaryPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const repo = new LocalStorageDiaryRepository();
    repo.findAll().then(setEntries);
  }, []);

  return (/* ... */);
}

// ❌ Bad - Server Componentは使わない（MVP版）
export default async function DiaryPage() {
  const entries = await getDiaryEntries();
  return (/* ... */);
}
```

### 3. UI設計

```typescript
// ✅ Good - 自動保存のみ
const handleTextChange = (text: string) => {
  setContent(text);
  debouncedSave(text); // 1秒後に自動保存
};

// ❌ Bad - 保存ボタンは作らない
<button onClick={handleSave}>保存</button>
```

### 4. Dial UI

```typescript
// ✅ Good - カレンダーが主要機能
const handleDialClick = () => {
  setShowCalendar(true);
};

const handleDialDrag = (direction: 'next' | 'prev') => {
  const newDate = new Date(selectedDate);
  newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
  setSelectedDate(newDate);
};

// ❌ Bad - 360度 = 30日のような複雑な計算はしない
const daysDelta = Math.round(deltaAngle / 12);
```

---

## Atomic Design階層の厳守

### 依存関係ルール

```
atoms → molecules → organisms → templates → pages
```

各階層は**下位階層のみ**をインポート可能:

```typescript
// ✅ Good - moleculesがatomsをインポート
// components/molecules/DateDisplay/DateDisplay.tsx
import { Text } from '@/components/atoms/Text';

// ❌ Bad - moleculesが他のmoleculesをインポート
import { SearchBar } from '@/components/molecules/SearchBar';

// ❌ Bad - moleculesがorganismsをインポート
import { Header } from '@/components/organisms/Header';
```

---

## Clean Architectureの厳守

### 依存関係ルール

```
Presentation → Application → Domain
```

```typescript
// ✅ Good - Presentation層がDomain層を使用
// app/page.tsx
import { DiaryEntry } from '@/lib/domain/diary-entry';

// ✅ Good - Application層がDomain層を使用
// lib/use-cases/create-diary-entry.ts
import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';

// ❌ Bad - Domain層がPresentation層を使用
// lib/domain/diary-entry.ts
import { Button } from '@/components/atoms/Button'; // NG!
```

---

## DDDの実践

### エンティティの使用

```typescript
// ✅ Good - ドメインエンティティを使用
const entry = DiaryEntry.create(date, content);
await repository.save(entry);

// ❌ Bad - プレーンオブジェクトを使用
const entry = {
  id: crypto.randomUUID(),
  date: date,
  content: content,
};
await repository.save(entry);
```

### ビジネスロジックの配置

```typescript
// ✅ Good - ビジネスロジックはDomain層
// lib/domain/diary-entry.ts
export class DiaryEntry {
  getPreviewText(maxLength: number = 100): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return `${this.content.substring(0, maxLength)}...`;
  }
}

// ❌ Bad - ビジネスロジックをPresentation層に配置
// components/molecules/DiaryPreview.tsx
const preview = entry.content.length > 100
  ? entry.content.substring(0, 100) + '...'
  : entry.content;
```

---

## TDDの実践

### Red-Green-Refactorサイクル

```bash
# 1. Red: テストを書く（失敗を確認）
pnpm test DiaryEntry

# 2. Green: 最小限の実装（成功を確認）
pnpm test DiaryEntry

# 3. Refactor: リファクタリング（成功を維持）
pnpm test DiaryEntry
```

### テストファーストの徹底

```typescript
// ✅ Good - 実装前にテストを書く
// DiaryEntry.test.ts
describe('DiaryEntry', () => {
  test('creates valid diary entry', () => {
    const entry = DiaryEntry.create(new Date(), 'Test content');
    expect(entry.content).toBe('Test content');
  });
});

// DiaryEntry.ts
export class DiaryEntry {
  static create(date: Date, content: string): DiaryEntry {
    // テストを通す最小限の実装
  }
}
```

---

## バージョン表記の統一

### 技術スタックのバージョン

```markdown
✅ Good - メジャーバージョンのみ
- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4

❌ Bad - マイナー/パッチバージョンまで記載
- Next.js 16.1.5
- React 19.2.4
- TypeScript 5.x
```

---

## セキュリティの考慮

### MVP版のセキュリティ対策

```typescript
// ✅ Good - XSS対策（Reactのデフォルトエスケープ）
<p>{entry.content}</p>

// ❌ Bad - dangerouslySetInnerHTMLは使わない
<p dangerouslySetInnerHTML={{ __html: entry.content }} />

// ✅ Good - Zodでバリデーション
const validated = DiaryEntrySchema.parse(input);

// ❌ Bad - バリデーションなし
const entry = DiaryEntry.create(input.date, input.content);
```

---

## パフォーマンスの考慮

### MVP版の最適化

```typescript
// ✅ Good - デバウンス処理（自動保存）
const debouncedSave = useMemo(
  () => debounce((content: string) => save(content), 1000),
  []
);

// ✅ Good - React.memoでメモ化
export const DiaryPreview = React.memo<DiaryPreviewProps>(({ entry }) => {
  // ...
});

// ✅ Good - LocalStorageのキャッシング
private cache: DiaryEntry[] | null = null;
```

---

## 設計書の更新

### 仕様変更時の手順

1. **設計書を先に更新**:
   ```bash
   # 該当する設計書を編集
   vim docs/05_FEATURES.md
   ```

2. **レビューを受ける**:
   ```bash
   # レビューを依頼
   git add docs/
   git commit -m "docs: Update feature specification for XXX"
   ```

3. **実装を開始**:
   ```bash
   # 設計書に基づいて実装
   ```

---

## チェックリスト

実装前に以下を確認:

### 機能実装時
- [ ] 該当する設計書（01, 05）を確認した
- [ ] MVP版の制約を理解した
- [ ] Atomic Designの階層を確認した
- [ ] TDDでテストを先に書いた

### コンポーネント作成時
- [ ] 04_UI_UX_DESIGN.md を確認した
- [ ] Atomic Designの階層を守った
- [ ] アクセシビリティ（ARIA属性）を考慮した
- [ ] レスポンシブデザインを実装した

### データモデル変更時
- [ ] 03_DATA_MODEL.md を確認した
- [ ] DDDの原則に従った
- [ ] Clean Architectureの依存関係を守った
- [ ] バリデーションを実装した

### セキュリティ関連時
- [ ] 06_SECURITY.md を確認した
- [ ] XSS対策を実装した
- [ ] 入力検証を実装した
- [ ] HTTPS強制を確認した（本番環境）

### パフォーマンス最適化時
- [ ] 07_PERFORMANCE.md を確認した
- [ ] Lighthouse目標（MVP: 80以上）を確認した
- [ ] 不要な再レンダリングを防止した
- [ ] デバウンス処理を実装した（自動保存）

---

## 違反例と修正

### 違反例1: Server Actionsの使用（MVP版）

```typescript
// ❌ Bad
'use server';
export async function createDiaryAction(formData: FormData) {
  // Server Actionsを使用している
}

// ✅ Good
'use client';
export function createDiary(date: Date, content: string) {
  const repository = new LocalStorageDiaryRepository();
  const entry = DiaryEntry.create(date, content);
  await repository.save(entry);
}
```

### 違反例2: 保存ボタンの実装

```typescript
// ❌ Bad
<button onClick={handleSave}>保存</button>

// ✅ Good
{/* 自動保存のみ、インジケーターで状態表示 */}
{isSaving ? '保存中... ●' : '✓ 保存しました'}
```

### 違反例3: Atomic Design違反

```typescript
// ❌ Bad - moleculesが他のmoleculesをインポート
// components/molecules/UserProfile/UserProfile.tsx
import { Avatar } from '@/components/molecules/Avatar';

// ✅ Good - Avatarをatomsに降格、またはUserProfileをorganismsに昇格
// components/organisms/UserProfile/UserProfile.tsx
import { Avatar } from '@/components/atoms/Avatar';
```

---

## まとめ

### 設計書準拠の3原則

1. **確認**: 実装前に該当する設計書を確認
2. **遵守**: 設計書に記載されている通りに実装
3. **更新**: 仕様変更時は設計書を先に更新

### 開発フロー

```
設計書を確認
  ↓
MVP版かPhase 2かを判断
  ↓
テストを先に書く（TDD）
  ↓
設計書に従って実装
  ↓
テストが通ることを確認
  ↓
設計書との整合性を再確認
```

---

**重要**: このルールに従わない実装は、設計書との不整合を引き起こし、将来的な保守性を損ないます。必ず設計書を確認してから実装してください。
