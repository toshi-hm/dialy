---
paths:
  - "src/components/**/*.{ts,tsx}"
---

# Atomic Design Architecture Rules

このプロジェクトは厳格なAtomic Design階層構造に従います。

## 階層構造

```
src/components/
├── atoms/       # 基本UI要素
├── molecules/   # atomsの組み合わせ
├── organisms/   # 複雑なUIコンポーネント
├── templates/   # ページレイアウト
└── app/         # Next.js App Router pages
```

## 依存関係ルール

**CRITICAL**: 各階層は下位階層のコンポーネントのみをインポートできます。

### atoms/
- **許可**: React標準機能、ユーティリティ関数、型定義のみ
- **禁止**: 他のコンポーネントのインポート
- **例**: Button, Input, Label, Icon, Text

```typescript
// ✅ Good
import type { FC } from 'react';
import { cn } from '@/lib/utils';

// ❌ Bad - atomsは他のコンポーネントをインポートできない
import { SearchBar } from '@/components/molecules/SearchBar';
```

### molecules/
- **許可**: atoms/ からのインポート
- **禁止**: molecules/, organisms/, templates/ からのインポート
- **例**: SearchBar, FormField, Card, NavItem

```typescript
// ✅ Good
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

// ❌ Bad - 同じ階層や上位階層はインポート不可
import { Header } from '@/components/organisms/Header';
```

### organisms/
- **許可**: atoms/, molecules/ からのインポート
- **禁止**: organisms/, templates/ からのインポート
- **例**: Header, Footer, DiaryCard, CommentSection

```typescript
// ✅ Good
import { SearchBar } from '@/components/molecules/SearchBar';
import { Button } from '@/components/atoms/Button';

// ❌ Bad - 同じ階層はインポート不可
import { Footer } from '@/components/organisms/Footer';
```

### templates/
- **許可**: atoms/, molecules/, organisms/ からのインポート
- **禁止**: templates/ からのインポート
- **例**: MainLayout, DiaryLayout, AuthLayout

```typescript
// ✅ Good
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';

// ❌ Bad - 同じ階層はインポート不可
import { OtherLayout } from '@/components/templates/OtherLayout';
```

### app/ (Next.js Pages)
- **許可**: すべての階層からのインポート
- **特徴**: templates/ のインスタンスとして実装

```typescript
// ✅ Good
import { MainLayout } from '@/components/templates/MainLayout';
import { DiaryCard } from '@/components/organisms/DiaryCard';
```

## コンポーネント配置ガイドライン

新しいコンポーネントを作成する際、以下の質問で適切な階層を判断:

1. **他のコンポーネントに依存するか？**
   - いいえ → atoms/
   - はい → 次の質問へ

2. **複数のコンポーネントを組み合わせているか？**
   - はい、2-3個の小さなコンポーネント → molecules/
   - はい、多数または複雑な組み合わせ → organisms/
   - はい、ページ全体のレイアウト → templates/

3. **ビジネスロジックやデータ取得を含むか？**
   - はい、ページ固有のロジック → app/
   - はい、再利用可能なロジック → organisms/

## ディレクトリ構造

各コンポーネントは専用ディレクトリに配置:

```
ComponentName/
├── ComponentName.tsx          # メインコンポーネント
├── ComponentName.stories.tsx  # Storybook stories
├── ComponentName.test.tsx     # Vitest tests
└── index.ts                   # 再エクスポート（オプション）
```

## 違反例と修正

### ❌ 違反: atomsが他のコンポーネントをインポート

```typescript
// src/components/atoms/PrimaryButton/PrimaryButton.tsx
import { Icon } from '@/components/atoms/Icon'; // NG!

export const PrimaryButton = () => {
  return <button><Icon name="plus" /> Add</button>;
};
```

**修正**: IconButtonとしてmoleculesに昇格させる

```typescript
// src/components/molecules/IconButton/IconButton.tsx
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';

export const IconButton = () => {
  return <Button><Icon name="plus" /> Add</Button>;
};
```

### ❌ 違反: moleculesが同階層をインポート

```typescript
// src/components/molecules/UserProfile/UserProfile.tsx
import { Avatar } from '@/components/molecules/Avatar'; // NG!

export const UserProfile = () => {
  return <div><Avatar /><span>Name</span></div>;
};
```

**修正**: Avatarをatomsに降格、またはUserProfileをorganismsに昇格

## 循環依存の防止

階層構造により循環依存は構造的に防止されますが、以下も確認:

1. **バレルエクスポートの適切な使用**
   ```typescript
   // ✅ Good - 明示的なインポート
   import { Button } from '@/components/atoms/Button';

   // ⚠️ 注意 - バレルエクスポートは循環依存のリスク
   import { Button } from '@/components/atoms';
   ```

2. **型定義の共有**
   ```typescript
   // ✅ Good - 型定義は src/types/ に配置
   import type { User } from '@/types/user';

   // ❌ Bad - コンポーネントから型をインポート
   import type { UserProps } from '@/components/organisms/UserCard';
   ```

## 例外とエスケープハッチ

Atomic Design は厳格なガイドラインですが、以下の場合は柔軟に対応:

1. **プロジェクト固有の判断**: チームで合意の上、明示的に文書化
2. **段階的リファクタリング**: 大規模な変更は段階的に実施
3. **レガシーコードの扱い**: 既存コードは新規作成時のルールに従わなくてもOK

**重要**: 例外を作る場合は、そのコンポーネントに理由をコメントで記載

```typescript
// NOTE: 例外 - このコンポーネントは[理由]のため、moleculesから別のmoleculesをインポート
// TODO: 将来的にはorganismsに昇格させる
```
