---
name: review-docs
description: 設計書に記載された要件を理解し、実装に必要な情報を抽出します。
---

# Review Docs Skill

設計書を参照し、実装に必要な情報を抽出するスキル。

## 使い方

```
/review-docs <機能名またはコンポーネント名>
```

## 例

```
/review-docs Dial
/review-docs 日記作成機能
/review-docs 自動保存
/review-docs DateRange値オブジェクト
```

## このスキルが行うこと

1. **該当する設計書の特定**: 機能名から関連する設計書を自動的に特定
2. **関連箇所の抽出**: 設計書から実装に必要な情報を抽出
3. **MVP版の確認**: MVP版とPhase 2の区別を明確化
4. **実装ガイドの提供**: 具体的な実装方針を提示

## 対象設計書

- `docs/00_INDEX.md`: プロジェクト概要
- `docs/01_REQUIREMENTS.md`: 要件定義
- `docs/02_ARCHITECTURE.md`: システムアーキテクチャ
- `docs/03_DATA_MODEL.md`: データモデル設計
- `docs/04_UI_UX_DESIGN.md`: UI/UX設計
- `docs/05_FEATURES.md`: 機能仕様
- `docs/06_SECURITY.md`: セキュリティ設計
- `docs/07_PERFORMANCE.md`: パフォーマンス設計

## 出力フォーマット

```markdown
# 設計書レビュー: <機能名>

## 📚 関連設計書

- 01_REQUIREMENTS.md: セクションX
- 05_FEATURES.md: セクションY
- 04_UI_UX_DESIGN.md: セクションZ

## 🎯 MVP版の仕様

### 必須要件
- 要件1
- 要件2

### 制約
- 制約1
- 制約2

## 🏗️ 実装方針

### アーキテクチャ
- LocalStorage使用
- Client Componentsのみ

### データモデル
- 使用するエンティティ
- バリデーションルール

### UI設計
- コンポーネント階層
- レスポンシブ対応

## 📝 実装チェックリスト

- [ ] テストを先に書く
- [ ] Atomic Designの階層を守る
- [ ] DDDの原則に従う
- [ ] アクセシビリティを考慮

## 🔗 参考コード例

（設計書から関連するコード例を抽出）
```

## 注意事項

- 設計書の内容を正確に抽出すること
- MVP版とPhase 2を混同しないこと
- 最新の設計書を参照すること（FINAL_REVIEW_RESULT.md参照）
