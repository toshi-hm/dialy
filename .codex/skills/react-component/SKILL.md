---
name: react-component
description: React/Next.jsコンポーネントを作成します。Atomic Design階層、TypeScript、Tailwind CSSを使用し、適切なpropsの型定義とアクセシビリティを考慮したコンポーネントを生成します。
---

# React/Next.js Component Creation

React 19.2.4 と Next.js 16.1.5 を使用した高品質なコンポーネントを作成します。

## 作成手順

### 1. Atomic Design階層の決定

コンポーネントを配置する適切な階層を決定:

- **atoms/**: 基本的なUI要素（Button, Input, Labelなど）。他のコンポーネントに依存しない
- **molecules/**: atomsの組み合わせ（SearchBar, FormFieldなど）
- **organisms/**: molecules/atomsを組み合わせた複雑なコンポーネント（Header, DiaryCardなど）
- **templates/**: ページレベルのレイアウト
- **app/**: Next.js App Routerのページ（テンプレートの具体的なインスタンス）

**重要**: 上位階層のコンポーネントは下位階層のコンポーネントのみをインポートできます。

### 2. コンポーネントの実装

```typescript
// src/components/[階層]/ComponentName/ComponentName.tsx
import type { FC } from 'react';

export interface ComponentNameProps {
  // Props定義（必須/オプションを明確に）
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const ComponentName: FC<ComponentNameProps> = ({
  title,
  description,
  onClick,
  className = '',
  children,
}) => {
  return (
    <div className={`基本スタイル ${className}`}>
      {/* コンポーネントの実装 */}
    </div>
  );
};
```

### 3. 実装ガイドライン

**TypeScript**:
- すべてのpropsに型定義を提供
- `FC<Props>` を使用
- エクスポートされるprops interfaceは `export interface` で定義

**Styling (Tailwind CSS v4.1)**:
- ユーティリティクラスを直接使用
- `className` propでカスタマイズ可能にする
- レスポンシブデザインには `sm:`, `md:`, `lg:`, `xl:` プレフィックスを使用

**アクセシビリティ**:
- セマンティックなHTML要素を使用
- 適切なARIA属性を追加
- キーボードナビゲーションをサポート
- 十分なカラーコントラスト比を確保

**パフォーマンス**:
- 必要に応じて `React.memo` を使用
- イベントハンドラーは適切にメモ化
- 重い計算は `useMemo` でキャッシュ

### 4. パスエイリアス

すべてのインポートに `@/` エイリアスを使用:

```typescript
import { Button } from '@/components/atoms/Button';
import { validateDiary } from '@/lib/validations/diary';
```

### 5. ファイル構成

コンポーネントディレクトリには以下を含める:

```
ComponentName/
├── ComponentName.tsx          # メインコンポーネント
├── ComponentName.stories.tsx  # Storybook stories（別スキルで作成）
├── ComponentName.test.tsx     # Vitest tests（別スキルで作成）
└── index.ts                   # 再エクスポート（オプション）
```

## 出力

1. コンポーネントファイルを作成
2. 実装した機能とアクセシビリティ対応を説明
3. 使用例を提供
4. 次のステップ（Storybook story作成、テスト作成）を提案
