---
description: Storybookのstoryファイルを作成する
---

## 手順

### 1. 対象コンポーネントを確認

story を作成するコンポーネントのファイルを読み込み、props の型定義を確認する。

### 2. storyファイルを作成

`ComponentName.stories.tsx` を同ディレクトリに作成する。

- `Meta` と `StoryObj` を使用
- `title` にAtomic Design階層を反映（例: `'atoms/Button'`）
- `tags: ['autodocs']` を設定
- `argTypes` でpropsの制御を定義

### 3. ストーリーのバリエーションを追加

- **Default**: 最も一般的な使用例
- **バリエーション**: 異なるpropsの組み合わせ
- **エッジケース**: 長いテキスト、空の値など
- **インタラクティブ**: play関数によるユーザー操作シミュレート

### 4. Storybookで確認

```bash
pnpm storybook
```
