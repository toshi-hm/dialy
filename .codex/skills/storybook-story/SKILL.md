---
name: storybook-story
description: Storybookのstoryファイルを作成します。コンポーネントの各状態（デフォルト、バリエーション、エッジケース）を網羅したstoriesを生成します。
---

# Storybook Story Creation

Storybook v10.2.0を使用して、コンポーネントの包括的なstoriesを作成します。

## 作成手順

### 1. Storyファイルの構造

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta = {
  title: '[階層]/ComponentName', // 例: 'atoms/Button', 'molecules/SearchBar'
  component: ComponentName,
  parameters: {
    layout: 'centered', // または 'fullscreen', 'padded'
  },
  tags: ['autodocs'],
  argTypes: {
    // Propsの制御を定義
    onClick: { action: 'clicked' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
    },
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

// デフォルトストーリー
export const Default: Story = {
  args: {
    // デフォルト値
  },
};

// バリエーション
export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

// エッジケース
export const LongText: Story = {
  args: {
    title: '非常に長いテキストの場合にどのように表示されるかをテストします',
  },
};

export const Empty: Story = {
  args: {
    title: '',
  },
};
```

### 2. 作成ガイドライン

**Storyの種類**:
- **Default**: 最も一般的な使用例
- **バリエーション**: 異なるpropsの組み合わせ
- **状態**: ローディング、エラー、空など
- **エッジケース**: 極端に長いテキスト、空の値など
- **インタラクティブ**: ユーザー操作が必要な状態

**argTypes設定**:
- イベントハンドラーには `action` を使用
- 選択肢がある場合は `control: 'select'` を使用
- 真偽値には `control: 'boolean'` を使用
- テキストには `control: 'text'` を使用

**パラメータ設定**:
- `layout`: 'centered', 'fullscreen', 'padded' から選択
- `backgrounds`: 背景色のバリエーションをテスト
- `viewport`: レスポンシブデザインのテスト

### 3. アクセシビリティテスト

Storybook の a11y アドオンを活用:

```typescript
export const AccessibilityTest: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};
```

### 4. インタラクティブストーリー

Play 関数を使用してユーザー操作をシミュレート:

```typescript
import { userEvent, within } from '@storybook/test';

export const WithInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
  },
};
```

## テストコマンド

```bash
pnpm storybook        # 開発サーバー起動 (localhost:6006)
pnpm build-storybook  # 静的ビルド
```

## 出力

1. `.stories.tsx` ファイルを作成
2. 作成したstoriesの一覧を説明
3. Storybookで確認する方法を案内
4. 次のステップとしてユニットテスト作成を提案
