---
description: React/Next.jsコンポーネントをAtomic Design階層に従って作成する
---

## 手順

### 1. Atomic Design階層を決定

コンポーネントの役割に応じて配置先を決定する:

- **atoms/**: 基本UI要素（Button, Input, Label）
- **molecules/**: atomsの組み合わせ（SearchBar, FormField）
- **organisms/**: 複雑なコンポーネント（Header, DiaryCard）
- **templates/**: ページレベルのレイアウト

### 2. コンポーネントファイルを作成

`src/components/[階層]/ComponentName/ComponentName.tsx` に作成する。

- `FC<Props>` で型定義
- `export type` でpropsを公開
- `className` propでカスタマイズ可能に
- セマンティックHTML + 適切なARIA属性

### 3. index.ts を作成（オプション）

再エクスポート用の `index.ts` を同ディレクトリに作成する。

### 4. 動作確認

Storybookまたはページ上で表示を確認する。
