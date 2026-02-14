---
trigger: always_on
glob:
description: 設計書準拠ルール。docs/配下の設計書に従い、MVP版とPhase 2を区別して開発する。
---

# Documentation Compliance Rule

このプロジェクトでは、`docs/`配下の設計書に厳密に従って開発を進めます。

## 原則

1. **設計書ファーストアプローチ**: 実装前に必ず該当する設計書を確認
2. **設計書との整合性**: 設計書に記載されていない実装は行わない
3. **変更時の設計書更新**: 仕様変更時は設計書を先に更新
4. **MVP版の尊重**: MVP版とPhase 2の区別を厳守

## 開発前の確認事項

### 該当する設計書を特定

| 実装内容 | 参照すべき設計書 |
|---------|----------------|
| 新機能の追加 | 01_REQUIREMENTS.md → 05_FEATURES.md |
| UIコンポーネント | 04_UI_UX_DESIGN.md → atomic-design.md |
| データモデル | 03_DATA_MODEL.md → ddd.md |
| アーキテクチャ | 02_ARCHITECTURE.md → clean-architecture.md |
| セキュリティ | 06_SECURITY.md |
| パフォーマンス | 07_PERFORMANCE.md |

### MVP版 vs Phase 2

**MVP版**: LocalStorage、Client Components、認証なし、自動保存のみ、カレンダーUI
**Phase 2**: Prisma + PostgreSQL、Server Components + Server Actions、NextAuth.js認証

## 実装時の厳守事項

### データ保存（MVP版）

```typescript
// ✅ Good - LocalStorageを使用
const repository = new LocalStorageDiaryRepository();
await repository.save(entry);

// ❌ Bad - Server ActionsやPrismaは使わない（MVP版）
await createDiaryAction(formData);
```

### コンポーネント設計（MVP版）

```typescript
// ✅ Good - Client Component
'use client';

// ❌ Bad - Server Componentは使わない（MVP版）
const DiaryPage = async () => { /* ... */ }
```

## チェックリスト

- [ ] 該当する設計書を確認した
- [ ] MVP版の制約を理解した
- [ ] Atomic Designの階層を守った
- [ ] DDDの原則に従った
- [ ] Clean Architectureの依存関係を守った
- [ ] TDDでテストを先に書いた

## 開発フロー

```
設計書を確認 → MVP版/Phase 2判断 → テスト先行(TDD) → 設計書に従い実装 → テスト確認 → 整合性再確認
```

**重要**: このルールに従わない実装は、設計書との不整合を引き起こし、将来的な保守性を損ないます。
