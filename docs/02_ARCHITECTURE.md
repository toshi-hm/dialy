# システムアーキテクチャ

## 目次
- [1. 技術スタック](#1-技術スタック)
- [2. アーキテクチャ概要](#2-アーキテクチャ概要)
- [3. ディレクトリ構造](#3-ディレクトリ構造)
- [4. レイヤー構成](#4-レイヤー構成)
- [5. データフロー](#5-データフロー)
- [6. コンポーネント設計](#6-コンポーネント設計)
- [7. 状態管理](#7-状態管理)

## 1. 技術スタック

### 1.1 フロントエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| フレームワーク | Next.js | 16 | SSR/SSG、ルーティング |
| UIライブラリ | React | 19 | UIコンポーネント |
| 言語 | TypeScript | 5 | 型安全性 |
| スタイリング | Tailwind CSS | 4 | ユーティリティファーストCSS |
| フォーム | React Hook Form | 7 | フォーム管理（将来） |
| バリデーション | Zod | 3 | スキーマバリデーション |

### 1.2 バックエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| API | Next.js API Routes | 16 | RESTful API（将来） |
| Server Actions | React Server Actions | 19 | データ変更（将来） |
| ORM | Prisma | 5 | データベースアクセス（将来） |
| データベース | SQLite / PostgreSQL | - | データ永続化（将来） |

### 1.3 開発ツール

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| パッケージマネージャー | pnpm | 10 | 依存関係管理 |
| リンター/フォーマッター | Biome | 1 | コード品質 |
| テストフレームワーク | Vitest | 2 | ユニットテスト |
| コンポーネント開発 | Storybook | 10 | UI開発・ドキュメント |
| VRT | reg-suit | 0 | ビジュアルリグレッションテスト |

### 1.4 MVP版での簡易実装

MVP版では完全にクライアントサイドで動作する簡易実装を採用:

**技術構成**:
- **データ保存**: LocalStorage（ブラウザ内完結）
- **コンポーネント**: Client Components（'use client'）
- **状態管理**: useState, useEffect, useContext
- **認証**: なし（ブラウザローカルで完結）
- **画像**: 対応なし（将来実装）

**将来実装（Phase 2）**:
- **データベース**: Prisma + PostgreSQL
- **API**: Server Actions / API Routes
- **認証**: NextAuth.js または Auth0
- **マルチユーザー**: ユーザーごとのデータ分離
- **データ移行**: LocalStorageからサーバーDBへの移行機能

## 2. アーキテクチャ概要

### 2.1 アーキテクチャ原則

本プロジェクトは以下の原則に従う:

1. **Clean Architecture**: ビジネスロジックをフレームワークから独立
2. **Domain Driven Design**: ドメインモデルを中心とした設計
3. **Atomic Design**: UIコンポーネントの階層化
4. **Test Driven Development**: テスト駆動開発

### 2.2 レイヤー構成図

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Next.js App Router (src/app/)                  │   │
│  │  - Pages                                         │   │
│  │  - Layouts                                       │   │
│  │  - Server Actions                                │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  UI Components (src/components/)                │   │
│  │  - atoms/    - molecules/                       │   │
│  │  - organisms/ - templates/                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Use Cases (src/lib/use-cases/)                 │   │
│  │  - CreateDiaryEntry                              │   │
│  │  - UpdateDiaryEntry                              │   │
│  │  - GetEntriesBySameDate                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Domain Models (src/lib/domain/)                │   │
│  │  - DiaryEntry (Entity)                           │   │
│  │  - DateValue (Value Object)                      │   │
│  │  - DiaryService (Domain Service)                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Repositories (src/lib/infrastructure/)         │   │
│  │  - DiaryRepository (Interface)                   │   │
│  │  - LocalStorageDiaryRepository (MVP)            │   │
│  │  - PrismaDiaryRepository (Future)                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 3. ディレクトリ構造

```
dialy/
├── docs/                          # 設計書
│   ├── 00_INDEX.md
│   ├── 01_REQUIREMENTS.md
│   ├── 02_ARCHITECTURE.md
│   └── ...
│
├── src/
│   ├── app/                       # Presentation: Next.js App Router
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── page.tsx              # トップページ（日記作成画面）
│   │   ├── globals.css           # グローバルスタイル
│   │   └── actions/              # Server Actions（Phase 2以降）
│   │       ├── diary.ts          # 日記関連のアクション
│   │       └── date.ts           # 日付関連のアクション
│   │
│   ├── components/                # Presentation: UI Components
│   │   ├── atoms/                # Atomic Design: 基本UI要素
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Text/
│   │   │   ├── Icon/
│   │   │   └── Badge/
│   │   │
│   │   ├── molecules/            # Atomic Design: 小さなコンポーネントの組み合わせ
│   │   │   ├── DateDisplay/      # 日付表示（◯月◯日（曜日））
│   │   │   ├── DiaryPreview/     # 日記プレビューカード
│   │   │   ├── CharacterCount/   # 文字数カウンター
│   │   │   └── SaveStatusIndicator/  # 自動保存状態表示
│   │   │
│   │   ├── organisms/            # Atomic Design: 複雑なUIコンポーネント
│   │   │   ├── Dial/             # 日付選択Dial
│   │   │   │   ├── Dial.tsx
│   │   │   │   ├── Dial.stories.tsx
│   │   │   │   ├── Dial.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── DiaryEditor/      # 日記編集エリア
│   │   │   ├── PastEntriesList/  # 過去の同じ日の日記リスト
│   │   │   └── Header/           # ヘッダー
│   │   │
│   │   └── templates/            # Atomic Design: ページレイアウト
│   │       └── MainLayout/       # メインレイアウト
│   │
│   ├── lib/
│   │   ├── domain/               # Domain: ビジネスエンティティ
│   │   │   ├── diary-entry.ts   # DiaryEntryエンティティ
│   │   │   ├── date-value.ts    # DateValue値オブジェクト
│   │   │   └── services/
│   │   │       └── diary-service.ts  # ドメインサービス
│   │   │
│   │   │   ├── interfaces/       # RepositoryやServiceのインターフェース
│   │   │       └── diary-repository.ts
│   │   │
│   │   ├── use-cases/            # Application: ユースケース
│   │   │   ├── create-diary-entry.ts
│   │   │   ├── update-diary-entry.ts
│   │   │   ├── delete-diary-entry.ts
│   │   │   ├── get-diary-entry.ts
│   │   │   └── get-entries-by-same-date.ts
│   │   │
│   │   ├── infrastructure/       # Infrastructure: 具体実装
│   │   │   ├── local-storage-diary-repository.ts  # MVP版: LocalStorage実装
│   │   │   └── prisma-diary-repository.ts         # 将来: Prisma実装
│   │   │
│   │   ├── validations/          # バリデーションスキーマ
│   │   │   └── diary.ts
│   │   │
│   │   └── utils/                # ユーティリティ
│   │       ├── date.ts           # 日付操作
│   │       ├── cn.ts             # classname結合
│   │       └── debounce.ts       # デバウンス処理
│   │
│   └── types/                     # 型定義
│       ├── diary.ts
│       └── date.ts
│
├── prisma/                        # Prismaスキーマ（将来）
│   └── schema.prisma
│
├── .storybook/                    # Storybook設定
├── .claude/                       # Claude Code設定
│   ├── rules/
│   └── skills/
│
├── CLAUDE.md                      # プロジェクトガイド
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── next.config.ts
```

## 4. レイヤー構成

### 4.1 Presentation Layer（表示層）

**責務**: ユーザーインターフェースとユーザー操作の処理

**構成要素**:
- **Next.js App Router** (`src/app/`)
  - ページコンポーネント
  - レイアウトコンポーネント
  - Server Actions（Phase 2以降）

- **UI Components** (`src/components/`)
  - Atomic Design階層に従ったコンポーネント
  - atoms → molecules → organisms → templates → pages

**依存関係**: Application Layer、Domain Layerに依存可能

### 4.2 Application Layer（アプリケーション層）

**責務**: ビジネスフローの調整、ユースケースの実装

**構成要素**:
- **Use Cases** (`src/lib/use-cases/`)
  - CreateDiaryEntryUseCase: 日記の新規作成
  - UpdateDiaryEntryUseCase: 日記の更新
  - DeleteDiaryEntryUseCase: 日記の削除
  - GetDiaryEntryUseCase: 特定日の日記取得
  - GetEntriesBySameDateUseCase: 過去5年分の同じ日の日記取得

**依存関係**: Domain Layerに依存

### 4.3 Domain Layer（ドメイン層）

**責務**: ビジネスロジックとビジネスルールの定義

**構成要素**:
- **Entities**（エンティティ）:
  - `DiaryEntry`: 日記エントリー
    - id: 一意識別子
    - date: 日付
    - content: 本文
    - createdAt: 作成日時
    - updatedAt: 更新日時

- **Value Objects**（値オブジェクト）:
  - `DateValue`: 日付を表す値オブジェクト
    - 同じ日の判定ロジック
    - 日付フォーマットロジック

- **Domain Services**（ドメインサービス）:
  - `DiaryService`: 日記に関するドメインロジック
    - 同じ日の日記を取得するロジック
    - 日記の並び順ロジック

**依存関係**: 外部に依存しない（純粋なTypeScript/JavaScript）

### 4.4 Infrastructure Layer（インフラ層）

**責務**: データ永続化、外部サービスとの連携

**構成要素**:
- **Repositories**:
  - `DiaryRepository` (Interface): リポジトリのインターフェース
  - `LocalStorageDiaryRepository` (MVP版): LocalStorage実装
  - `PrismaDiaryRepository` (将来): Prisma実装

**依存関係**: Domain Layerのインターフェースを実装

## 5. データフロー

### 5.1 日記作成フロー（MVP版: クライアントサイド）

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. テキスト入力
       ↓
┌─────────────────────┐
│  DiaryEditor        │  (Client Component)
│  - テキストエリア     │
│  - 自動保存処理       │
└──────┬──────────────┘
       │ 2. ユースケース実行（クライアント側）
       ↓
┌──────────────────────────┐
│ CreateDiaryEntryUseCase  │  (Application Layer)
│  - バリデーション          │
│  - ビジネスフロー調整      │
└──────┬───────────────────┘
       │ 3. エンティティ作成
       ↓
┌─────────────────────┐
│  DiaryEntry         │  (Domain Layer)
│  - バリデーション     │
│  - ビジネスルール     │
└──────┬──────────────┘
       │ 4. リポジトリ保存
       ↓
┌──────────────────────────┐
│ LocalStorageDiaryRepo    │  (Infrastructure)
│  - LocalStorageに保存     │
└──────────────────────────┘
```

### 5.1.1 将来版: サーバーサイドフロー

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. テキスト入力
       ↓
┌─────────────────────┐
│  DiaryEditor        │  (Client Component)
│  - テキストエリア     │
│  - 自動保存処理       │
└──────┬──────────────┘
       │ 2. Server Action呼び出し
       ↓
┌─────────────────────┐
│  createDiaryEntry   │  (Server Action)
│  - バリデーション     │
└──────┬──────────────┘
       │ 3. ユースケース実行
       ↓
┌──────────────────────────┐
│ CreateDiaryEntryUseCase  │  (Application Layer)
│  - ビジネスフロー調整      │
└──────┬───────────────────┘
       │ 4. エンティティ作成
       ↓
┌─────────────────────┐
│  DiaryEntry         │  (Domain Layer)
│  - バリデーション     │
│  - ビジネスルール     │
└──────┬──────────────┘
       │ 5. リポジトリ保存
       ↓
┌──────────────────────────┐
│ PrismaDiaryRepository    │  (Infrastructure)
│  - PostgreSQLに保存       │
└──────────────────────────┘
```

### 5.2 過去の日記取得フロー（MVP版: クライアントサイド）

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Dial操作またはカレンダーで日付選択
       ↓
┌─────────────────────┐
│  Dial               │  (Client Component)
│  - 日付変更イベント   │
└──────┬──────────────┘
       │ 2. ユースケース実行（クライアント側）
       ↓
┌───────────────────────────────┐
│ GetEntriesBySameDateUseCase   │  (Application)
│  - 過去5年分の日付計算          │
└──────┬────────────────────────┘
       │ 3. リポジトリ取得
       ↓
┌──────────────────────────┐
│ LocalStorageDiaryRepo    │  (Infrastructure)
│  - LocalStorageから取得   │
└──────┬───────────────────┘
       │ 4. データ返却
       ↓
┌─────────────────────┐
│ PastEntriesList     │  (Client Component)
│  - 日記リスト表示     │
└─────────────────────┘
```

### 5.2.1 将来版: サーバーサイドフロー

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Dial回転で日付選択
       ↓
┌─────────────────────┐
│  Dial               │  (Client Component)
│  - 日付変更イベント   │
└──────┬──────────────┘
       │ 2. Server Action呼び出し
       ↓
┌──────────────────────────┐
│  getEntriesBySameDate    │  (Server Action)
└──────┬───────────────────┘
       │ 3. ユースケース実行
       ↓
┌───────────────────────────────┐
│ GetEntriesBySameDateUseCase   │  (Application)
│  - 過去5年分の日付計算          │
└──────┬────────────────────────┘
       │ 4. リポジトリ取得
       ↓
┌──────────────────────────┐
│ PrismaDiaryRepository    │  (Infrastructure)
│  - PostgreSQLから取得     │
└──────┬───────────────────┘
       │ 5. データ返却
       ↓
┌─────────────────────┐
│ PastEntriesList     │  (Server Component)
│  - 日記リスト表示     │
└─────────────────────┘
```

### 5.3 Dial操作による日付変更フロー（MVP版）

**パターンA: カレンダーから選択**

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Dialをクリック/タップ
       ↓
┌─────────────────────┐
│  Dial               │  (Client Component)
│  - onClickハンドラー  │
└──────┬──────────────┘
       │ 2. カレンダーダイアログ表示
       ↓
┌─────────────────────┐
│  CalendarDialog     │  (Client Component)
│  - 日付選択           │
└──────┬──────────────┘
       │ 3. 日付変更コールバック
       ↓
┌─────────────────────┐
│  page.tsx           │  (Client Component)
│  - 選択日付の状態更新 │
└──────┬──────────────┘
       │ 4. 日付表示更新
       ↓
┌─────────────────────┐
│  DateDisplay        │  (Molecule)
│  - ◯月◯日（曜日）表示│
└─────────────────────┘
       │ 5. 日記データ再取得
       ↓
┌──────────────────────────┐
│  getEntriesBySameDate    │  (Use Case - Client)
└──────────────────────────┘
```

**パターンB: Dialで前後移動**

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Dialをドラッグ回転
       ↓
┌─────────────────────┐
│  Dial               │  (Client Component)
│  - onDragハンドラー  │
│  - 回転方向判定       │
└──────┬──────────────┘
       │ 2. 日付変更コールバック（±1日）
       ↓
┌─────────────────────┐
│  page.tsx           │  (Client Component)
│  - 選択日付の状態更新 │
└──────┬──────────────┘
       │ 3. 日付表示更新
       ↓
┌─────────────────────┐
│  DateDisplay        │  (Molecule)
│  - ◯月◯日（曜日）表示│
└─────────────────────┘
       │ 4. 日記データ再取得
       ↓
┌──────────────────────────┐
│  getEntriesBySameDate    │  (Use Case - Client)
└──────────────────────────┘
```

## 6. コンポーネント設計

### 6.1 Atomic Design階層

#### Atoms（基本UI要素）
- `Button`: 汎用ボタン
- `Input`: テキスト入力
- `Text`: テキスト表示
- `Icon`: アイコン
- `Badge`: バッジ（文字数表示など）

#### Molecules（小さなコンポーネントの組み合わせ）
- `DateDisplay`: 日付表示（◯月◯日（曜日））
- `DiaryPreview`: 日記プレビューカード（年 + 冒頭テキスト）
- `CharacterCount`: 文字数カウンター
- `SaveStatusIndicator`: 自動保存状態（保存中/完了/失敗）

#### Organisms（複雑なUIコンポーネント）
- `Dial`: 日付選択Dial（円形コントロール）
- `DiaryEditor`: 日記編集エリア（テキストエリア + 自動保存）
- `PastEntriesList`: 過去の同じ日の日記リスト
- `Header`: ヘッダー

#### Templates（ページレイアウト）
- `MainLayout`: メインレイアウト（Header + Main content）

### 6.2 Atomic Design依存ルール

- `atoms` は `atoms`・`lib`・`types` のみ参照可能
- `molecules` は `atoms`・`molecules`・`lib`・`types` のみ参照可能
- `organisms` は `atoms`・`molecules`・`organisms`・`lib`・`types` のみ参照可能
- `templates` は `atoms`・`molecules`・`organisms`・`templates`・`lib`・`types` のみ参照可能
- 上位階層から下位階層への参照は許可、下位から上位への逆依存は禁止
- 依存違反（例: `atoms -> organisms`）は設計違反としてレビューで差し戻す

### 6.3 主要コンポーネントの詳細

#### Dial（日付選択Dial）

```typescript
interface DialProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;  // 選択可能な最小日付
  maxDate?: Date;  // 選択可能な最大日付（デフォルト: 今日）
}

// 実装イメージ
export const Dial: FC<DialProps> = ({
  selectedDate,
  onDateChange,
  maxDate = new Date(),
}) => {
  // SVGで円形のDialを描画
  // ドラッグイベントで回転角度を計算
  // 回転角度から日付を計算してonDateChangeを呼び出す
};
```

#### DiaryEditor（日記編集エリア）

```typescript
interface DiaryEditorProps {
  date: Date;
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

// 実装イメージ
export const DiaryEditor: FC<DiaryEditorProps> = ({
  date,
  initialContent = '',
  onSave,
  onDelete,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  // デバウンス処理で自動保存
  const debouncedSave = useMemo(
    () => debounce((value: string) => onSave(value), 1000),
    [onSave]
  );

  useEffect(() => {
    if (content !== initialContent) {
      debouncedSave(content);
    }
  }, [content]);

  // ...
};
```

#### PastEntriesList（過去の日記リスト）

```typescript
interface PastEntriesListProps {
  entries: DiaryEntry[];
  onEntryClick?: (entry: DiaryEntry) => void;
}

// 実装イメージ
export const PastEntriesList: FC<PastEntriesListProps> = ({
  entries,
  onEntryClick,
}) => {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <DiaryPreview
          key={entry.id}
          entry={entry}
          onClick={() => onEntryClick?.(entry)}
        />
      ))}
    </div>
  );
};
```

## 7. 状態管理

### 7.1 状態管理戦略

MVP版ではシンプルな状態管理を採用:

1. **Client State**: React Hooksで管理
2. **Persistence State**: LocalStorageRepositoryで管理
3. **URL State**: Next.js App Routerのパラメータで管理（将来）

### 7.2 主要な状態

| 状態 | 管理場所 | 管理方法 |
|------|---------|---------|
| 選択中の日付 | Client | useState |
| 編集中の日記内容 | Client | useState |
| 過去の日記データ | Client | LocalStorageRepository + useEffect |
| 保存状態 | Client | useState (isSaving) |
| エラー状態 | Client | useState |

### 7.3 将来的な拡張

規模が大きくなった場合:
- **Zustand**: グローバル状態管理
- **React Query / SWR**: サーバー状態のキャッシング
- **Jotai / Recoil**: アトミックな状態管理

## 8. パフォーマンス考慮事項

### 8.1 最適化戦略

1. **MVPはClient Components前提**: LocalStorage利用のため、画面統合はClient Componentsで構成
2. **Code Splitting**: 動的インポートで遅延ロード
3. **メモ化**: React.memo、useMemo、useCallbackの活用
4. **デバウンス**: 自動保存処理のデバウンス
5. **仮想スクロール**: 日記リストが長い場合（将来）

### 8.2 レンダリング最適化

```typescript
// DiaryEditor: メモ化で不要な再レンダリングを防ぐ
export const DiaryEditor = React.memo<DiaryEditorProps>(({ ... }) => {
  // ...
});

// PastEntriesList: 仮想スクロール（将来）
import { useVirtualizer } from '@tanstack/react-virtual';
```

## 9. セキュリティ考慮事項

### 9.1 XSS対策
- ユーザー入力のサニタイゼーション
- Reactのデフォルトエスケープに依存

### 9.2 CSRF対策
- MVPでは書き込み先がLocalStorageのためCSRFは適用対象外
- Phase 2でServer Actions/API Routeへ移行後にCSRF対策を適用

### 9.3 データ検証
- クライアント側: Zodスキーマで入力検証
- サーバー側: Phase 2でServer Actions/API Route導入後に再検証

## 10. 将来的な技術的拡張

### 10.1 データベース移行
- LocalStorage → Prisma + PostgreSQL
- マイグレーションスクリプトの作成

### 10.2 認証の追加
- NextAuth.js導入
- マルチユーザー対応

### 10.3 PWA化
- Service Workerの導入
- オフライン対応
- キャッシュ戦略

### 10.4 リアルタイム同期
- WebSocketまたはServer-Sent Events
- 複数デバイス間での同期
