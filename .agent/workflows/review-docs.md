---
description: 設計書を参照し、指定された機能の実装に必要な情報を抽出する
---

## 手順

### 1. 機能名を確認

ユーザーから指定された機能名・コンポーネント名を確認する。

### 2. 関連設計書を読み込み

以下の設計書から関連するセクションを特定し、読み込む:

- `docs/00_INDEX.md` — プロジェクト概要
- `docs/01_REQUIREMENTS.md` — 要件定義
- `docs/02_ARCHITECTURE.md` — システムアーキテクチャ
- `docs/03_DATA_MODEL.md` — データモデル設計
- `docs/04_UI_UX_DESIGN.md` — UI/UX設計
- `docs/05_FEATURES.md` — 機能仕様
- `docs/06_SECURITY.md` — セキュリティ設計
- `docs/07_PERFORMANCE.md` — パフォーマンス設計

### 3. MVP版の仕様を抽出

MVP版（LocalStorage + Client Components）とPhase 2（Prisma + Server Components）を区別して抽出する。

### 4. 実装方針を提示

アーキテクチャ、データモデル、UI設計、テスト方針を整理して提示する。

### 5. チェックリストとコード例を提供

実装チェックリストと、設計書から抽出した関連コード例を提供する。
