---
paths:
  - "src/**/*.{ts,tsx}"
---

# React/Next.js Development Rules

React 19.2.4 と Next.js 16.1.5 の開発ガイドライン。

## React 19の新機能と変更点

### 1. Actions（新機能）

フォーム送信とデータ変更を簡潔に処理。

```typescript
// ✅ Good - Server Actionsを使用
'use server';

export async function createDiaryEntry(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // バリデーション
  if (!title || !content) {
    return { error: 'Title and content are required' };
  }

  // データ保存
  await db.diary.create({ data: { title, content } });

  revalidatePath('/diary');
  return { success: true };
}

// クライアントコンポーネント
'use client';

import { useActionState } from 'react';
import { createDiaryEntry } from './actions';

export function DiaryForm() {
  const [state, formAction, isPending] = useActionState(createDiaryEntry, null);

  return (
    <form action={formAction}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存'}
      </button>
      {state?.error && <p className="text-red-600">{state.error}</p>}
    </form>
  );
}
```

### 2. useOptimistic（楽観的UI更新）

```typescript
'use client';

import { useOptimistic } from 'react';

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
  );

  async function handleSubmit(formData: FormData) {
    const title = formData.get('title') as string;
    const newTodo = { id: Date.now(), title, completed: false };

    addOptimisticTodo(newTodo);
    await createTodo(formData);
  }

  return (
    <>
      <form action={handleSubmit}>
        <input name="title" />
        <button>追加</button>
      </form>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id} className={todo.pending ? 'opacity-50' : ''}>
            {todo.title}
          </li>
        ))}
      </ul>
    </>
  );
}
```

### 3. use() - Promise/Contextの読み取り

```typescript
import { use } from 'react';

// Promiseの読み取り
export function DiaryEntry({ entryPromise }: { entryPromise: Promise<DiaryEntry> }) {
  const entry = use(entryPromise);

  return (
    <article>
      <h1>{entry.title}</h1>
      <p>{entry.content}</p>
    </article>
  );
}

// Contextの読み取り（条件付きでも可）
export function ConditionalTheme({ useTheme }: { useTheme: boolean }) {
  const theme = useTheme ? use(ThemeContext) : 'light';
  return <div className={theme}>Content</div>;
}
```

### 4. ref as prop（React 19の変更）

forwardRefは不要になりました。

```typescript
// ✅ Good - React 19: 直接refをpropとして受け取る
interface ButtonProps {
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({ children, ref, ...props }: ButtonProps) {
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  );
}

// ❌ Old - React 18以前: forwardRefが必要だった
import { forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <button ref={ref} {...props}>
        {children}
      </button>
    );
  }
);
```

## Next.js 16.1.5のベストプラクティス

### App Router構造

```
src/app/
├── layout.tsx          # ルートレイアウト
├── page.tsx            # ホームページ
├── globals.css         # グローバルスタイル
├── diary/
│   ├── layout.tsx      # 日記セクションレイアウト
│   ├── page.tsx        # 日記一覧ページ
│   ├── [id]/
│   │   └── page.tsx    # 日記詳細ページ（動的ルート）
│   └── new/
│       └── page.tsx    # 新規作成ページ
└── api/
    └── entries/
        └── route.ts    # APIルート
```

### Server ComponentsとClient Components

#### Server Components（デフォルト）

```typescript
// app/diary/page.tsx
import { getDiaryEntries } from '@/lib/api';

// デフォルトでServer Component
export default async function DiaryPage() {
  // サーバーで直接データ取得
  const entries = await getDiaryEntries();

  return (
    <div>
      <h1>My Diary</h1>
      {entries.map((entry) => (
        <DiaryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
```

**Server Componentsのメリット**:
- データ取得がサーバーで完結
- バンドルサイズが小さい
- SEO対応が容易
- 環境変数やAPIキーを安全に使用

#### Client Components

`'use client'` ディレクティブで明示。

```typescript
// components/organisms/DiaryForm/DiaryForm.tsx
'use client';

import { useState } from 'react';

export function DiaryForm() {
  const [title, setTitle] = useState('');

  return (
    <form>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
    </form>
  );
}
```

**Client Componentsが必要な場合**:
- `useState`, `useEffect` などのフック
- イベントハンドラー (`onClick`, `onChange` など)
- ブラウザAPIの使用 (`localStorage`, `window` など)
- クラスコンポーネント

### 境界の配置戦略

```typescript
// ✅ Good - Client Componentを最小限に
// app/diary/page.tsx (Server Component)
import { getDiaryEntries } from '@/lib/api';
import { DiaryForm } from '@/components/organisms/DiaryForm'; // Client Component

export default async function DiaryPage() {
  const entries = await getDiaryEntries();

  return (
    <div>
      <h1>My Diary</h1>
      {/* この部分はサーバーでレンダリング */}
      {entries.map((entry) => (
        <article key={entry.id}>
          <h2>{entry.title}</h2>
          <p>{entry.content}</p>
        </article>
      ))}
      {/* インタラクティブな部分のみClient Component */}
      <DiaryForm />
    </div>
  );
}

// ❌ Bad - ページ全体をClient Component化
'use client';

export default function DiaryPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    // クライアントでデータ取得（遅い、SEO不利）
    fetch('/api/entries').then(/* ... */);
  }, []);

  // ...
}
```

### データ取得パターン

#### 1. Server Componentで直接取得

```typescript
// app/diary/[id]/page.tsx
export default async function DiaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await db.diary.findUnique({ where: { id } });

  if (!entry) {
    notFound();
  }

  return (
    <article>
      <h1>{entry.title}</h1>
      <p>{entry.content}</p>
    </article>
  );
}
```

#### 2. 並列データ取得

```typescript
// 複数のデータを並列で取得
export default async function DashboardPage() {
  // Promise.allで並列実行
  const [user, entries, stats] = await Promise.all([
    getUser(),
    getDiaryEntries(),
    getStatistics(),
  ]);

  return (
    <div>
      <UserProfile user={user} />
      <DiaryList entries={entries} />
      <Statistics stats={stats} />
    </div>
  );
}
```

#### 3. ストリーミングとSuspense

```typescript
// app/diary/page.tsx
import { Suspense } from 'react';

export default function DiaryPage() {
  return (
    <div>
      <h1>My Diary</h1>
      {/* 高速なコンテンツは即座に表示 */}
      <QuickContent />
      {/* 遅いコンテンツはローディング表示 */}
      <Suspense fallback={<DiaryListSkeleton />}>
        <DiaryList />
      </Suspense>
    </div>
  );
}

// 遅いデータ取得を含むコンポーネント
async function DiaryList() {
  const entries = await getDiaryEntries(); // 時間がかかる可能性

  return (
    <ul>
      {entries.map((entry) => (
        <li key={entry.id}>{entry.title}</li>
      ))}
    </ul>
  );
}
```

### Server Actions

#### 基本的な使い方

```typescript
// app/diary/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createDiaryEntry(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // バリデーション
  if (!title || !content) {
    return { error: 'All fields are required' };
  }

  // データベースに保存
  const entry = await db.diary.create({
    data: { title, content, createdAt: new Date() },
  });

  // キャッシュの再検証
  revalidatePath('/diary');

  // リダイレクト
  redirect(`/diary/${entry.id}`);
}
```

#### フォームで使用

```typescript
// app/diary/new/page.tsx
import { createDiaryEntry } from '../actions';

export default function NewDiaryPage() {
  return (
    <form action={createDiaryEntry}>
      <input name="title" placeholder="タイトル" required />
      <textarea name="content" placeholder="内容" required />
      <button type="submit">保存</button>
    </form>
  );
}
```

#### プログレッシブエンハンスメント

```typescript
// components/organisms/DiaryForm/DiaryForm.tsx
'use client';

import { useActionState } from 'react';
import { createDiaryEntry } from '@/app/diary/actions';

export function DiaryForm() {
  const [state, formAction, isPending] = useActionState(
    createDiaryEntry,
    { error: null }
  );

  return (
    <form action={formAction}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存'}
      </button>
      {state?.error && (
        <p className="text-red-600">{state.error}</p>
      )}
    </form>
  );
}
```

### メタデータAPI

#### 静的メタデータ

```typescript
// app/diary/[id]/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diary Entry',
  description: 'View your diary entry',
};

export default function DiaryDetailPage() {
  // ...
}
```

#### 動的メタデータ

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = await db.diary.findUnique({ where: { id } });

  return {
    title: entry?.title || 'Diary Entry',
    description: entry?.content.substring(0, 160),
    openGraph: {
      title: entry?.title,
      description: entry?.content.substring(0, 160),
      images: ['/og-image.png'],
    },
  };
}
```

### キャッシングとデータ再検証

#### 自動キャッシング

```typescript
// デフォルトでキャッシュされる
async function getDiaryEntries() {
  const res = await fetch('https://api.example.com/entries');
  return res.json();
}

// キャッシュを無効化
async function getDiaryEntries() {
  const res = await fetch('https://api.example.com/entries', {
    cache: 'no-store',
  });
  return res.json();
}

// 定期的に再検証
async function getDiaryEntries() {
  const res = await fetch('https://api.example.com/entries', {
    next: { revalidate: 3600 }, // 1時間ごとに再検証
  });
  return res.json();
}
```

#### 手動再検証

```typescript
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function createEntry(formData: FormData) {
  // データ作成
  await db.diary.create({ /* ... */ });

  // パスベースの再検証
  revalidatePath('/diary');

  // タグベースの再検証
  revalidateTag('diary-entries');
}

// タグ付きfetch
async function getDiaryEntries() {
  const res = await fetch('https://api.example.com/entries', {
    next: { tags: ['diary-entries'] },
  });
  return res.json();
}
```

## React のベストプラクティス

### 1. コンポーネント設計

```typescript
// ✅ Good - 単一責任の原則
export function DiaryCard({ entry }: { entry: DiaryEntry }) {
  return (
    <article className="p-4 border rounded">
      <h2>{entry.title}</h2>
      <p>{entry.content}</p>
      <time>{entry.date.toLocaleDateString()}</time>
    </article>
  );
}

export function DiaryList({ entries }: { entries: DiaryEntry[] }) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <DiaryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

// ❌ Bad - 複数の責任が混在
export function DiaryComponent() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // データ取得、フィルタリング、ソート、表示が混在...
}
```

### 2. Props の型定義

```typescript
// ✅ Good - 明示的な型定義
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button: FC<ButtonProps> = ({ children, ...props }) => {
  // ...
};

// ✅ Better - HTMLButtonAttributesを継承
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  // ...
};
```

### 3. Hooks のルール

```typescript
// ✅ Good - Hooksはトップレベルで呼び出す
export function DiaryForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    // ...
  };

  return (/* ... */);
}

// ❌ Bad - 条件付きでHooksを呼び出す
export function DiaryForm({ showContent }: { showContent: boolean }) {
  const [title, setTitle] = useState('');

  if (showContent) {
    const [content, setContent] = useState(''); // NG!
  }

  return (/* ... */);
}
```

### 4. useEffect の適切な使用

```typescript
// ✅ Good - 副作用の処理に使用
useEffect(() => {
  // DOM操作、subscription、タイマーなど
  const timer = setTimeout(() => {
    console.log('Delayed action');
  }, 1000);

  // クリーンアップ
  return () => clearTimeout(timer);
}, []);

// ❌ Bad - データ取得（Server Componentで行うべき）
useEffect(() => {
  fetch('/api/entries').then(/* ... */);
}, []);

// ❌ Bad - 状態の変換（useMemoを使うべき）
useEffect(() => {
  setFilteredEntries(entries.filter((e) => e.tag === selectedTag));
}, [entries, selectedTag]);

// ✅ Good - useMemoを使用
const filteredEntries = useMemo(
  () => entries.filter((e) => e.tag === selectedTag),
  [entries, selectedTag]
);
```

### 5. パフォーマンス最適化

```typescript
// React.memoでメモ化
export const DiaryCard = React.memo<DiaryCardProps>(({ entry }) => {
  return (
    <article>
      <h2>{entry.title}</h2>
      <p>{entry.content}</p>
    </article>
  );
});

// useCallbackでコールバックをメモ化
export function DiaryList() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  const handleDelete = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <div>
      {entries.map((entry) => (
        <DiaryCard key={entry.id} entry={entry} onDelete={handleDelete} />
      ))}
    </div>
  );
}

// useMemoで重い計算をメモ化
const statistics = useMemo(() => {
  return calculateComplexStatistics(entries);
}, [entries]);
```

## まとめ

### React 19の主な変更
- Actions: フォーム処理の簡素化
- useOptimistic: 楽観的UI更新
- use(): Promise/Contextの読み取り
- ref as prop: forwardRef不要

### Next.js 16のベストプラクティス
- Server Components優先
- Client Componentsは最小限に
- Server Actionsでデータ変更
- 適切なキャッシング戦略
- Suspenseでストリーミング

これらの原則に従うことで、高速で保守性の高いアプリケーションを構築できます。
