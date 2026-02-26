# コンポーネント設計ガイド

## 目次
- [1. Atomic Design原則](#1-atomic-design原則)
- [2. コンポーネント設計規則](#2-コンポーネント設計規則)
- [3. ファイル構成](#3-ファイル構成)
- [4. テスト戦略](#4-テスト戦略)
- [5. Storybook運用](#5-storybook運用)
- [6. アクセシビリティ](#6-アクセシビリティ)

## 1. Atomic Design原則

### 1.1 階層構造

このプロジェクトでは厳格なAtomic Design階層を採用しています：

```
atoms → molecules → organisms → templates → pages
```

**依存関係ルール**: 上位階層は下位階層のみを参照できます。

- ✅ **許可**: `molecules` が `atoms` をインポート
- ✅ **許可**: `organisms` が `molecules` と `atoms` をインポート
- ❌ **禁止**: `atoms` が `molecules` をインポート
- ❌ **禁止**: `molecules` が `organisms` をインポート

### 1.2 各階層の役割

#### Atoms（原子）
最小単位のコンポーネント。単一の責務を持ち、他のコンポーネントに依存しません。

**例**: Button, Input, Text, Icon, Badge

**特徴**:
- Propsで完全に制御可能
- 副作用なし（純粋関数）
- 状態を持たない（または最小限）
- スタイルバリエーションを持つ

```typescript
// src/components/atoms/Button/Button.tsx
export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
};

export const Button = ({ variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  // 実装
};
```

#### Molecules（分子）
複数のAtomsを組み合わせた小さな機能単位。

**例**: DateDisplay, DiaryPreview, CharacterCount, SaveStatusIndicator

**特徴**:
- 2〜3個のAtomsで構成
- 明確な単一の目的
- ビジネスロジックは持たない
- 表示とUIロジックのみ

```typescript
// src/components/molecules/DateDisplay/DateDisplay.tsx
import { Text } from '@/components/atoms/Text';
import { formatDateWithWeekday } from '@/lib/utils/date';

export type DateDisplayProps = {
  date: Date;
  className?: string;
};

export const DateDisplay = ({ date, className }: DateDisplayProps) => {
  return (
    <Text variant="heading" size="xl" className={className}>
      {formatDateWithWeekday(date)}
    </Text>
  );
};
```

#### Organisms（生物）
Molecules/Atomsを組み合わせた複雑なコンポーネント。独立した機能を持ちます。

**例**: Dial, DiaryEditor, PastEntriesList, DeleteConfirmDialog

**特徴**:
- 独立した機能単位
- 状態を持つことが多い
- 外部とのやり取りあり（callback props）
- ビジネスロジックを含む場合がある

```typescript
// src/components/organisms/DiaryEditor/DiaryEditor.tsx
export type DiaryEditorProps = {
  date: Date;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onRequestDelete?: () => void;
};

export const DiaryEditor = ({ date, initialContent, onSave, onRequestDelete }: DiaryEditorProps) => {
  // 状態管理、デバウンス、自動保存などの複雑なロジック
};
```

#### Templates（テンプレート）
ページレイアウトの骨組み。データは持たず、配置のみを定義。

**例**: MainLayout

**特徴**:
- ページ構造の定義
- レスポンシブ対応
- データは受け取らない
- children や slot でコンテンツを受け取る

```typescript
// src/components/templates/MainLayout/MainLayout.tsx
export type MainLayoutProps = {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
};

export const MainLayout = ({ sidebar, children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        {sidebar && <aside>{sidebar}</aside>}
        <main>{children}</main>
      </div>
    </div>
  );
};
```

#### Pages（ページ）
実際のページコンポーネント。`src/app/` 配下に配置。

**特徴**:
- データ取得（UseCase呼び出し）
- 状態管理
- イベントハンドリング
- Templatesにデータを流し込む

## 2. コンポーネント設計規則

### 2.1 Props設計

#### 必須原則
1. **明確な型定義**: すべてのPropsに型を定義
2. **デフォルト値**: オプショナルなPropsにはデフォルト値を設定
3. **命名規則**: イベントハンドラーは `on` プレフィックス
4. **制限された選択肢**: 文字列リテラル型を使用

```typescript
// ❌ 悪い例
type BadProps = {
  type: string;
  onClick: any;
};

// ✅ 良い例
type GoodProps = {
  variant: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};
```

#### children vs 明示的Props

- **children**: 汎用的なコンテナコンポーネント
- **明示的Props**: 特定の構造を持つコンポーネント

```typescript
// children を使う場合（汎用）
type ContainerProps = {
  children: React.ReactNode;
};

// 明示的Props（特定の構造）
type ModalProps = {
  title: string;
  body: React.ReactNode;
  footer: React.ReactNode;
};
```

### 2.2 状態管理

#### Atoms/Molecules
- 基本的に状態を持たない
- 必要な場合はUI状態のみ（例: hover, focus）

#### Organisms
- ローカル状態を持つ（useState, useReducer）
- 副作用を扱う（useEffect）
- カスタムフックで複雑なロジックを分離

#### Pages
- グローバル状態管理
- データフェッチング
- URL状態管理

### 2.3 スタイリング規則

#### Tailwind CSS使用ガイドライン

1. **ユーティリティファースト**: Tailwindクラスを優先
2. **cn()ヘルパー**: 条件付きクラス結合に使用
3. **カスタムクラス**: 必要最小限に抑える

```typescript
import { cn } from '@/lib/utils/cn';

export const Button = ({ variant, size, className, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        // ベーススタイル
        'rounded-md font-medium transition-colors',
        // バリエーション
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
        },
        // サイズ
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        // カスタムクラス
        className,
      )}
      {...props}
    />
  );
};
```

#### レスポンシブデザイン

Tailwindのブレークポイントを使用：

```typescript
<div className="
  w-full          // mobile (< 768px)
  md:w-1/2        // tablet (768-1023px)
  lg:w-1/3        // desktop (>= 1024px)
">
```

### 2.4 パフォーマンス最適化

#### React.memo
再レンダリングを抑制したい場合に使用：

```typescript
import { memo } from 'react';

export const ExpensiveComponent = memo(({ data }: Props) => {
  // 重い計算
  return <div>{/* ... */}</div>;
});

ExpensiveComponent.displayName = 'ExpensiveComponent';
```

#### useMemo / useCallback
重い計算やコールバック関数の最適化：

```typescript
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  doSomething(data);
}, [data]);
```

## 3. ファイル構成

### 3.1 標準構成

各コンポーネントは以下のファイルで構成：

```
ComponentName/
├── ComponentName.tsx         # コンポーネント本体
├── ComponentName.test.tsx    # ユニットテスト
├── ComponentName.stories.tsx # Storybook
└── index.ts                  # re-export
```

### 3.2 index.ts

各階層のindex.tsで階層全体をエクスポート：

```typescript
// src/components/atoms/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Text } from './Text';
// ...

// 使用側
import { Button, Input, Text } from '@/components/atoms';
```

## 4. テスト戦略

### 4.1 テスト範囲

#### Atoms/Molecules: 60%以上
- レンダリング確認
- Props変更による表示変更
- 基本的なインタラクション

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  test('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  test('applies variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
  });

  test('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Organisms: 80%以上
- 複雑なインタラクション
- 状態変更
- 副作用
- エッジケース

#### Pages: 統合テスト
- UseCase連携
- エンドツーエンドフロー
- エラーハンドリング

### 4.2 テストの原則

1. **ユーザー視点**: 実装詳細ではなく、ユーザーの操作をテスト
2. **アクセシビリティ**: `getByRole` を優先使用
3. **非同期処理**: `waitFor`, `findBy*` を適切に使用
4. **モック最小化**: 必要最小限のモックに留める

## 5. Storybook運用

### 5.1 ストーリー構成

各コンポーネントは以下のストーリーを持つ：

1. **Default**: 標準状態
2. **Variants**: すべてのバリエーション
3. **States**: インタラクティブな状態（hover, focus, disabled等）
4. **EdgeCases**: エッジケース（空文字、最大長等）

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};
```

### 5.2 Controls設定

Propsをインタラクティブに操作できるようにControlsを設定：

```typescript
const meta = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;
```

## 6. アクセシビリティ

### 6.1 基本原則

1. **セマンティックHTML**: 適切なHTML要素を使用
2. **ARIA属性**: 必要な場合のみ追加
3. **キーボード操作**: すべての機能をキーボードで操作可能に
4. **フォーカス管理**: 視覚的なフォーカスインジケーター
5. **スクリーンリーダー**: 情報が音声で伝わるように

### 6.2 ARIA属性ガイドライン

```typescript
// ボタン
<button
  aria-label="メニューを開く"
  aria-expanded={isOpen}
>
  <Icon name="menu" />
</button>

// 入力フィールド
<input
  aria-label="日記を入力"
  aria-describedby="char-count"
  aria-invalid={hasError}
/>
<span id="char-count">残り {remaining} 文字</span>

// ライブリージョン（動的コンテンツ）
<output aria-live="polite">
  {saveStatus === 'saved' && '保存しました'}
</output>

// ダイアログ
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">削除確認</h2>
</div>
```

### 6.3 キーボード操作

すべてのインタラクティブ要素は以下をサポート：

- **Tab**: フォーカス移動
- **Enter / Space**: アクション実行
- **Escape**: ダイアログ/モーダル閉じる
- **Arrow Keys**: リスト/メニュー内の移動

```typescript
const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === 'Escape') {
    onClose();
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onConfirm();
  }
};
```

### 6.4 コントラスト要件

WCAG 2.1 AA準拠（最小コントラスト比）:
- 通常テキスト: 4.5:1
- 大きいテキスト: 3:1
- UIコンポーネント: 3:1

Tailwindカラーパレットで推奨される組み合わせ：

```typescript
// ✅ 良い例（十分なコントラスト）
<div className="bg-white text-gray-900">テキスト</div>
<div className="bg-blue-600 text-white">ボタン</div>

// ❌ 悪い例（コントラスト不足）
<div className="bg-gray-100 text-gray-300">テキスト</div>
```

## まとめ

このガイドラインに従うことで：

1. **一貫性**: 統一されたコード品質
2. **保守性**: 変更しやすく、理解しやすいコード
3. **拡張性**: 新しい機能を追加しやすい構造
4. **品質**: 高いテストカバレッジとアクセシビリティ
5. **協業**: チーム全体で共通の理解

新しいコンポーネントを作成する際は、必ずこのガイドを参照してください。
