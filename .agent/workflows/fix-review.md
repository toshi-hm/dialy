---
description: GitHubのPRについたレビューコメントを取得し、修正案を提示する
---

// turbo-all

## 手順

### 1. PRレビューコメントを取得

PR番号を確認し、インラインコメントを取得する:

```bash
gh api "repos/:owner/:repo/pulls/{PR番号}/comments" --paginate \
  | jq '[.[] | {
    id: .id,
    path: .path,
    start_line: .start_line,
    line: .line,
    body: .body,
    user: .user.login,
    html_url: .html_url
  }]'
```

### 2. PR全体レビューを取得

```bash
gh api "repos/:owner/:repo/pulls/{PR番号}/reviews" --paginate \
  | jq '[.[] | {
    id: .id,
    state: .state,
    body: .body,
    user: .user.login
  }]'
```

### 3. 各コメントを分析・分類

取得した各コメントについて、対象ファイルの該当行を読み込み、以下の基準で分類する:

| カテゴリ | 基準 | アクション |
|---|---|---|
| 🔴 修正必須 | バグ、セキュリティ問題、ロジックエラー | コード修正案を提示 |
| 🟡 修正推奨 | パフォーマンス改善、可読性、ベストプラクティス | 修正案を提示し検討 |
| 🟢 対応不要 | スタイルの好み、既に対応済み、誤解 | 理由を説明 |
| 💬 質問 | コードの意図を尋ねる質問 | 回答を提示 |

### 4. 修正案を提示

分類結果と修正案をまとめて提示する。修正前/修正後のコードを含める。

### 5. ユーザー承認後に修正を実施

承認された修正をコードに適用する。

### 6. テストを実行

```bash
pnpm test -- --run
```
