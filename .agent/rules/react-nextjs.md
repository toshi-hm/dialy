---
trigger: always_on
glob: src/**/*.{ts,tsx}
description: React 19とNext.js 16の開発ガイドライン。Server/Client Components、Server Actions、Hooks、パフォーマンス最適化。
---

# React/Next.js Development Rules

React 19 と Next.js 16 の開発ガイドライン。

## React 19の新機能と変更点

### 1. Actions（新機能）

```typescript
'use client';
import { useActionState } from 'react';

export const DiaryForm = () => {
  const [state, formAction, isPending] = useActionState(createDiaryEntry, null);
  return (
    <form action={formAction}>
      <input name="title" required />
      <button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存'}
      </button>
    </form>
  );
};
```

### 2. useOptimistic（楽観的UI更新）

```typescript
const [optimisticTodos, addOptimisticTodo] = useOptimistic(
  todos,
  (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
);
```

### 3. use() - Promise/Contextの読み取り

```typescript
import { use } from 'react';

export const DiaryEntry = ({ entryPromise }: { entryPromise: Promise<DiaryEntry> }) => {
  const entry = use(entryPromise);
  return <article><h1>{entry.title}</h1></article>;
};
```

### 4. ref as prop（forwardRef不要）

```typescript
// ✅ Good - React 19: 直接refをpropとして受け取る
export const Button = ({ children, ref, ...props }: ButtonProps) => {
  return <button ref={ref} {...props}>{children}</button>;
};

// ❌ Old - forwardRefは不要
```

## Next.js App Router

### Server ComponentsとClient Components

#### Server Components（デフォルト）

```typescript
// app/diary/page.tsx - デフォルトでServer Component
const DiaryPage = async () => {
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

#### Client Components

`'use client'` ディレクティブで明示。useState, useEffect, イベントハンドラー, ブラウザAPIが必要な場合に使用。

```typescript
// ✅ Good - Client Componentを最小限に
// Server Componentの中でClient Componentを使用
const DiaryPage = async () => {
  const entries = await getDiaryEntries();
  return (
    <div>
      {entries.map((entry) => <article key={entry.id}>{entry.title}</article>)}
      <DiaryForm /> {/* インタラクティブな部分のみClient */}
    </div>
  );
}
```

### データ取得パターン

```typescript
// 並列データ取得
const [user, entries, stats] = await Promise.all([
  getUser(), getDiaryEntries(), getStatistics(),
]);

// Suspenseでストリーミング
<Suspense fallback={<DiaryListSkeleton />}>
  <DiaryList />
</Suspense>
```

### Server Actions

```typescript
'use server';
import { revalidatePath } from 'next/cache';

export const createDiaryEntry = async (formData: FormData) => {
  const title = formData.get('title') as string;
  await db.diary.create({ data: { title } });
  revalidatePath('/diary');
}
```

## ベストプラクティス

### Props の型定義

```typescript
// HTMLAttributes を継承
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', className, ...props
}) => { /* ... */ };
```

### Hooks のルール

- トップレベルで呼び出す（条件分岐内で使わない）
- `useEffect` は副作用のみ（データ取得はServer Componentで）
- 状態変換には `useMemo` を使用

### パフォーマンス最適化

```typescript
// React.memoでメモ化
export const DiaryCard = React.memo<DiaryCardProps>(({ entry }) => { /* ... */ });

// useCallbackでコールバックをメモ化
const handleDelete = useCallback((id: string) => {
  setEntries((prev) => prev.filter((e) => e.id !== id));
}, []);
```

## まとめ

- Server Components優先、Client Componentsは最小限に
- Server Actionsでデータ変更
- 適切なキャッシング戦略
- Suspenseでストリーミング
- forwardRef不要（React 19）
