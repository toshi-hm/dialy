# パフォーマンス設計

## 目次
- [1. パフォーマンス目標](#1-パフォーマンス目標)
- [2. レンダリング最適化](#2-レンダリング最適化)
- [3. データ取得最適化](#3-データ取得最適化)
- [4. キャッシング戦略](#4-キャッシング戦略)
- [5. バンドル最適化](#5-バンドル最適化)
- [6. 画像最適化（将来）](#6-画像最適化将来)
- [7. モニタリング・計測](#7-モニタリング計測)
- [8. パフォーマンスチェックリスト](#8-パフォーマンスチェックリスト)

## 1. パフォーマンス目標

### 1.1 Core Web Vitals目標

| 指標 | 目標値 | 測定方法 |
|------|-------|---------|
| LCP (Largest Contentful Paint) | < 2.5秒 | Lighthouse |
| FID (First Input Delay) | < 100ms | Real User Monitoring |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| TTFB (Time to First Byte) | < 600ms | WebPageTest |
| FCP (First Contentful Paint) | < 1.8秒 | Lighthouse |

### 1.2 アプリケーション固有の目標

| 機能 | 目標値 |
|------|-------|
| 初回ページ読み込み | < 3秒 |
| Dial回転のレスポンス | < 100ms |
| 自動保存の実行 | 入力停止後1秒 |
| 過去の日記読み込み | < 500ms |
| 日付変更時の画面更新 | < 200ms |

### 1.3 Lighthouseスコア目標

**MVP版**:

| カテゴリ | 目標スコア |
|---------|----------|
| Performance | 80以上 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

**将来版（Phase 2）**:

| カテゴリ | 目標スコア |
|---------|----------|
| Performance | 90以上 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

## 2. レンダリング最適化

### 2.1 コンポーネント設計

#### MVP版: Client Componentsのみ

MVP版ではLocalStorageを使用するため、すべてClient Componentsで実装します。

```typescript
// MVP版: すべてClient Component
// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { LocalStorageDiaryRepository } from '@/lib/infrastructure/local-storage-diary-repository';

const HomePage = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // LocalStorageから読み込み
    const repository = new LocalStorageDiaryRepository();
    repository.findBySameDate(selectedDate, 5).then(setEntries);
  }, [selectedDate]);

  return (
    <div>
      <DateDisplay date={selectedDate} />
      <DiaryEditor date={selectedDate} />
      <PastEntriesList entries={entries} />
    </div>
  );
}
```

**パフォーマンス考慮事項（MVP版）**:
- LocalStorageの読み込みは初回のみ実行
- その後はReact Stateで管理
- メモ化（React.memo、useMemo）で不要な再レンダリングを防止

#### 将来版（Phase 2）: Server Components優先

サーバーDBに移行後、Server Componentsを優先的に使用します。

```typescript
// 将来版: Server Component優先
// app/page.tsx
const HomePage = async () => {
  const entries = await getDiaryEntries(); // サーバーでデータ取得

  return (
    <div>
      <DateDisplay date={new Date()} /> {/* Server Component */}
      <DiaryEditor /> {/* Client Component */}
      <PastEntriesList entries={entries} /> {/* Server Component */}
    </div>
  );
}
```

**メリット（将来版）**:
- データ取得がサーバーで完結
- バンドルサイズが小さい
- SEO対応が容易

### 2.2 React.memoでメモ化

不要な再レンダリングを防ぐ。

```typescript
// components/molecules/DiaryPreview/DiaryPreview.tsx
import React from 'react';

export const DiaryPreview = React.memo<DiaryPreviewProps>(
  ({ entry, onClick }) => {
    return (
      <article onClick={onClick}>
        <h3>{entry.getYear()}年</h3>
        <p>{entry.getPreviewText()}</p>
        <span>{entry.getCharacterCount()}文字</span>
      </article>
    );
  }
);
```

### 2.3 useMemoとuseCallbackの活用

```typescript
// components/organisms/PastEntriesList/PastEntriesList.tsx
export const PastEntriesList = ({ entries }: PastEntriesListProps) => {
  // 重い計算をメモ化
  const sortedEntries = useMemo(
    () => entries.sort((a, b) => b.date.getTime() - a.date.getTime()),
    [entries]
  );

  // コールバックをメモ化
  const handleEntryClick = useCallback((entry: DiaryEntry) => {
    console.log('Entry clicked:', entry.id);
  }, []);

  return (
    <div>
      {sortedEntries.map((entry) => (
        <DiaryPreview
          key={entry.id}
          entry={entry}
          onClick={() => handleEntryClick(entry)}
        />
      ))}
    </div>
  );
}
```

### 2.4 仮想スクロール（将来）

日記リストが長くなった場合、仮想スクロールを導入。

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export const PastEntriesList = ({ entries }: PastEntriesListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // 各アイテムの高さ
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <DiaryPreview entry={entries[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.5 Suspenseとストリーミング

重いコンポーネントはSuspenseでストリーミング。

```typescript
// app/page.tsx
import { Suspense } from 'react';

const HomePage = () => {
  return (
    <div>
      <DateDisplay date={new Date()} />
      <DiaryEditor />

      {/* 過去の日記は遅延ロード */}
      <Suspense fallback={<PastEntriesListSkeleton />}>
        <PastEntriesList />
      </Suspense>
    </div>
  );
}

// 非同期コンポーネント
const PastEntriesList = async () => {
  const entries = await getEntriesBySameDate(new Date());

  return (
    <div>
      {entries.map((entry) => (
        <DiaryPreview key={entry.id} entry={entry} />
      ))}
    </div>
  );
};
```

## 3. データ取得最適化

### 3.1 並列データ取得

複数のデータを並列で取得。

```typescript
// ✅ Good - Promise.allで並列取得
const HomePage = async () => {
  const [todayEntry, pastEntries] = await Promise.all([
    getTodayEntry(),
    getEntriesBySameDate(new Date()),
  ]);

  return (/* ... */);
}

// ❌ Bad - 順次取得（遅い）
const HomePage = async () => {
  const todayEntry = await getTodayEntry();
  const pastEntries = await getEntriesBySameDate(new Date());

  return (/* ... */);
}
```

### 3.2 データプリフェッチング

Next.js 16のprefetch機能を活用。

```typescript
import Link from 'next/link';

// リンクホバー時にプリフェッチ
<Link href="/diary/2026-02-08" prefetch={true}>
  2026年2月8日の日記
</Link>
```

### 3.3 インクリメンタルデータ取得

最初は必要最小限のデータを取得し、必要に応じて追加取得。

```typescript
// 最初は過去3年分のみ取得
const recentEntries = await getEntriesBySameDate(date, 3);

// スクロールで追加読み込み
const loadMoreEntries = async () => {
  const olderEntries = await getEntriesBySameDate(date, 5);
};
```

### 3.4 デバウンス処理

自動保存のデバウンス。

```typescript
// lib/utils/debounce.ts
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 使用例
const debouncedSave = useMemo(
  () => debounce((content: string) => saveDiary(content), 1000),
  []
);
```

## 4. キャッシング戦略

### 4.1 Next.js自動キャッシング

Next.js 16のデフォルトキャッシングを活用。

```typescript
// デフォルトでキャッシュされる
const getDiaryEntries = async () => {
  const res = await fetch('https://api.example.com/entries');
  return res.json();
};

// キャッシュを無効化
const getDiaryEntries = async () => {
  const res = await fetch('https://api.example.com/entries', {
    cache: 'no-store',
  });
  return res.json();
};

// 定期的に再検証（Revalidate）
const getDiaryEntries = async () => {
  const res = await fetch('https://api.example.com/entries', {
    next: { revalidate: 3600 }, // 1時間ごとに再検証
  });
  return res.json();
};
```

### 4.2 タグベースの再検証

```typescript
// データにタグを付与
const getDiaryEntries = async () => {
  const res = await fetch('https://api.example.com/entries', {
    next: { tags: ['diary-entries'] },
  });
  return res.json();
};

// Server Actionで特定タグを再検証
'use server';

import { revalidateTag } from 'next/cache';

export const createDiaryAction = async (formData: FormData) => {
  // 日記作成処理
  await createDiary(/* ... */);

  // タグを再検証
  revalidateTag('diary-entries');
};
```

### 4.3 LocalStorageキャッシング（MVP版）

LocalStorage版では、すべてのデータをメモリにキャッシュ。

```typescript
// LocalStorageのデータをキャッシュ
class LocalStorageDiaryRepository implements DiaryRepository {
  private cache: DiaryEntry[] | null = null;

  private async loadCache(): Promise<DiaryEntry[]> {
    if (this.cache !== null) {
      return this.cache;
    }

    const storage = this.getStorage();
    this.cache = storage.entries.map((e) =>
      DiaryEntry.reconstruct(
        e.id,
        new Date(e.date),
        e.content,
        new Date(e.createdAt),
        new Date(e.updatedAt)
      )
    );

    return this.cache;
  }

  private invalidateCache(): void {
    this.cache = null;
  }

  async save(entry: DiaryEntry): Promise<void> {
    // 保存処理
    // ...

    // キャッシュ無効化
    this.invalidateCache();
  }

  async findAll(): Promise<DiaryEntry[]> {
    return this.loadCache();
  }
}
```

### 4.4 React Query / SWR（将来）

将来的にReact QueryまたはSWRを導入してサーバー状態をキャッシング。

```typescript
// React Query例
import { useQuery } from '@tanstack/react-query';

const useDiaryEntries = (date: Date) => {
  return useQuery({
    queryKey: ['diary-entries', date.toISOString()],
    queryFn: () => getEntriesBySameDate(date),
    staleTime: 5 * 60 * 1000, // 5分間はフレッシュとみなす
  });
};
```

## 5. バンドル最適化

### 5.1 Dynamic Import（動的インポート）

大きなコンポーネントは遅延ロード。

```typescript
import dynamic from 'next/dynamic';

// ダイアログは初回表示時のみロード
const DeleteConfirmDialog = dynamic(
  () => import('@/components/organisms/DeleteConfirmDialog'),
  { ssr: false }
);

// 使用
export const DiaryEditor = () => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div>
      <button onClick={() => setShowDialog(true)}>削除</button>
      {showDialog && <DeleteConfirmDialog />}
    </div>
  );
}
```

### 5.2 Tree Shaking

未使用のコードを除外。

```typescript
// ✅ Good - 必要な関数のみインポート
import { format } from 'date-fns';

// ❌ Bad - ライブラリ全体をインポート
import * as dateFns from 'date-fns';
```

### 5.3 バンドルアナライザー

バンドルサイズを分析。

```bash
npm install --save-dev @next/bundle-analyzer
```

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

```bash
# バンドル分析
ANALYZE=true pnpm build
```

### 5.4 外部依存の最小化

重い依存ライブラリを避ける。

```typescript
// ✅ Good - ネイティブAPIを使用
const uuid = crypto.randomUUID();

// ❌ Bad - 不要なライブラリ
import { v4 as uuidv4 } from 'uuid';
```

## 6. 画像最適化（将来）

### 6.1 Next.js Image コンポーネント

将来的に画像添付機能を実装する際は、Next.js Imageコンポーネントを使用。

```typescript
import Image from 'next/image';

<Image
  src="/diary-photo.jpg"
  alt="日記の写真"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  quality={85}
/>
```

### 6.2 WebP形式への変換

Next.jsが自動的にWebPに変換。

### 6.3 レスポンシブ画像

```typescript
<Image
  src="/photo.jpg"
  alt="Photo"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  fill
  style={{ objectFit: 'cover' }}
/>
```

## 7. モニタリング・計測

### 7.1 Lighthouse CI

CI/CDパイプラインにLighthouseを統合。

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm build
      - run: pnpm start & npx wait-on http://localhost:3000
      - run: npx lighthouse-ci --upload.target=temporary-public-storage http://localhost:3000
```

### 7.2 Web Vitalsの計測

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 7.3 カスタムパフォーマンス計測

```typescript
// lib/utils/performance.ts
export const measurePerformance = (label: string) => {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

      // 将来的にAnalyticsに送信
      // sendToAnalytics({ metric: label, value: duration });
    },
  };
}

// 使用例
const measure = measurePerformance('Dial rotation');
// 処理
measure.end();
```

### 7.4 エラー監視（将来）

Sentryなどのエラー監視ツールを導入。

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

## 8. パフォーマンスチェックリスト

### 8.1 レンダリング

- [ ] MVPはClient Components中心で構成（Phase 2でServer Components優先へ移行）
- [ ] Client Componentsは必要最小限
- [ ] React.memoで不要な再レンダリングを防止
- [ ] useMemo/useCallbackで重い計算をメモ化
- [ ] Suspenseでストリーミング

### 8.2 データ取得

- [ ] 並列データ取得（Promise.all）
- [ ] デバウンス処理（自動保存）
- [ ] インクリメンタルデータ取得
- [ ] プリフェッチング

### 8.3 キャッシング

- [ ] Next.jsの自動キャッシング活用
- [ ] タグベースの再検証
- [ ] LocalStorageのメモリキャッシュ

### 8.4 バンドル

- [ ] Dynamic Importで遅延ロード
- [ ] Tree Shakingで未使用コード除外
- [ ] バンドルアナライザーで分析
- [ ] 外部依存の最小化

### 8.5 モニタリング

- [ ] Lighthouse CI導入
- [ ] Web Vitals計測
- [ ] カスタムパフォーマンス計測
- [ ] エラー監視（将来）

## 9. パフォーマンス改善の優先順位

### 9.1 高優先度（MVP版で実施）

1. Client Componentsの再レンダリング最適化
2. デバウンス処理（自動保存）
3. React.memoでメモ化
4. LocalStorageキャッシング

### 9.2 中優先度（短期実装）

1. Suspenseとストリーミング
2. Dynamic Import
3. バンドルアナライザーでの分析
4. Lighthouse CI導入

### 9.3 低優先度（長期実装）

1. 仮想スクロール
2. React Query / SWR導入
3. エラー監視（Sentry）
4. 画像最適化

## 10. パフォーマンス計測結果の例

### 10.1 目標値との比較

| 指標 | 目標値 | 現在値 | 状態 |
|------|-------|-------|------|
| LCP | < 2.5秒 | 1.8秒 | ✅ 達成 |
| FID | < 100ms | 50ms | ✅ 達成 |
| CLS | < 0.1 | 0.05 | ✅ 達成 |
| TTFB | < 600ms | 400ms | ✅ 達成 |
| 初回読み込み | < 3秒 | 2.5秒 | ✅ 達成 |
| Dial回転 | < 100ms | 60ms | ✅ 達成 |

### 10.2 改善の継続

パフォーマンスは継続的に監視・改善する。

- 週次: Lighthouseスコアの確認
- 月次: Web Vitalsのレビュー
- 四半期: パフォーマンス改善施策の実施

## まとめ

- **Core Web Vitals**: LCP < 2.5秒、FID < 100ms、CLS < 0.1
- **レンダリング最適化**: MVPはClient Components中心、将来はServer Components優先
- **データ取得最適化**: 並列取得、デバウンス、プリフェッチ
- **キャッシング**: Next.jsの自動キャッシング、LocalStorageキャッシュ
- **バンドル最適化**: Dynamic Import、Tree Shaking
- **モニタリング**: Lighthouse CI、Web Vitals計測
