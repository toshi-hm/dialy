# Commit Guidelines

設計書との整合性を保つためのコミットガイドライン。

## コミット前のチェック

### 1. 設計書との整合性確認

```bash
# 実装が設計書に従っているか確認
/review-docs <実装した機能名>
```

### 2. テストの実行

```bash
# すべてのテストが通ることを確認
pnpm test

# カバレッジの確認
pnpm test:coverage
```

### 3. リントとフォーマット

```bash
# Biomeでチェック
pnpm lint
pnpm format:check
```

---

## コミットメッセージの形式

### Conventional Commits形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必須）

| Type | 用途 | 例 |
|------|------|---|
| `feat` | 新機能 | `feat(diary): Add auto-save functionality` |
| `fix` | バグ修正 | `fix(dial): Fix date selection on mobile` |
| `docs` | ドキュメント | `docs(architecture): Update MVP specification` |
| `style` | コードスタイル | `style(button): Apply Tailwind CSS classes` |
| `refactor` | リファクタリング | `refactor(repository): Simplify LocalStorage logic` |
| `test` | テスト | `test(diary-entry): Add validation tests` |
| `chore` | ビルド・設定 | `chore(deps): Update dependencies` |

### Scope（推奨）

実装した機能・コンポーネントの名前:

- `diary`: 日記機能全般
- `dial`: Dial UI
- `editor`: DiaryEditor
- `repository`: リポジトリ層
- `domain`: ドメイン層
- `ui`: UI全般

### Subject（必須）

- 50文字以内
- 動詞の命令形で開始（Add, Fix, Update, Remove）
- 文末にピリオドなし

### Body（オプション）

- 変更の理由と内容を説明
- 設計書の参照を含める

### Footer（オプション）

- 破壊的変更: `BREAKING CHANGE:`
- 関連Issue: `Closes #123`

---

## コミット例

### 例1: 新機能の追加

```
feat(diary): Implement auto-save functionality

Implemented auto-save feature as specified in 05_FEATURES.md section 6.

- Add debounce hook for auto-save (1 second delay)
- Display save status indicator
- Use LocalStorageDiaryRepository for MVP version

Ref: docs/05_FEATURES.md#6-自動保存
```

### 例2: バグ修正

```
fix(dial): Fix date selection beyond 30 days

Fixed Dial UI to use calendar dialog for primary date selection,
as specified in 04_UI_UX_DESIGN.md and 05_FEATURES.md.

- Add calendar dialog component
- Use Dial rotation only for prev/next day navigation
- Update tests for new behavior

Closes #42
Ref: docs/05_FEATURES.md#1-dial操作による日付選択
```

### 例3: 設計書の更新

```
docs(features): Update Dial UI specification

Updated Dial operation specification to clarify:
- Calendar dialog as primary UI
- Dial rotation as auxiliary navigation

Ref: FINAL_REVIEW_RESULT.md
```

### 例4: リファクタリング

```
refactor(domain): Apply DDD principles to DiaryEntry

Refactored DiaryEntry to follow DDD principles:
- Make properties readonly (immutability)
- Add factory methods (create, reconstruct)
- Move business logic into entity methods

Ref: docs/03_DATA_MODEL.md
Ref: .claude/rules/ddd.md
```

---

## コミット前のチェックリスト

```bash
# スキルを使用して自動チェック
/git-commit-push
```

手動で確認する場合:

- [ ] 設計書に従って実装した
- [ ] テストを書いた（TDD）
- [ ] テストが全て通る
- [ ] リント・フォーマットチェックが通る
- [ ] MVP版とPhase 2を混同していない
- [ ] Atomic Designの階層を守った
- [ ] Clean Architectureの依存関係を守った
- [ ] コミットメッセージが規約に従っている

---

## 設計書の参照方法

コミットメッセージのBodyまたはFooterに設計書の参照を含める:

```
Ref: docs/01_REQUIREMENTS.md#fr-02-日記作成機能
Ref: docs/05_FEATURES.md#2-日記の作成
Ref: .claude/rules/tdd.md
```

---

## Co-Authored-By の使用

Claude Codeと協力して実装した場合:

```
feat(diary): Add DiaryEntry entity

Implemented DiaryEntry entity following DDD principles.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## コミットの粒度

### Good（適切な粒度）

```bash
# 1つの機能を1つのコミットに
git commit -m "feat(diary): Add auto-save functionality"

# 1つのバグ修正を1つのコミットに
git commit -m "fix(dial): Fix mobile touch event handling"
```

### Bad（粒度が大きすぎる）

```bash
# 複数の機能をまとめている
git commit -m "feat: Add diary, dial, and editor"
```

### Bad（粒度が小さすぎる）

```bash
# 些細な変更を細かく分けすぎ
git commit -m "feat(diary): Add variable"
git commit -m "feat(diary): Add function"
git commit -m "feat(diary): Add test"
```

---

## まとめ

### コミットの3原則

1. **設計書との整合性**: 設計書に従って実装し、参照を含める
2. **テストの実行**: すべてのテストが通ることを確認
3. **規約の遵守**: Conventional Commits形式でコミットメッセージを書く

### 推奨フロー

```
実装完了
  ↓
設計書との整合性確認（/review-docs）
  ↓
テスト実行（pnpm test）
  ↓
リント・フォーマット（pnpm lint）
  ↓
コミット（/git-commit-push または手動）
```

---

**重要**: 設計書に従わない実装は、レビュー時に差し戻される可能性があります。必ず設計書を確認してからコミットしてください。
