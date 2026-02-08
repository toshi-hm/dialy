---
paths:
  - "src/components/**/*.{ts,tsx}"
  - "src/app/**/*.{ts,tsx}"
---

# Design Guidelines

レスポンシブデザイン、Tailwind CSS、アクセシビリティに関するガイドライン。

## Responsive Design

### モバイルファーストアプローチ

Tailwind CSSはモバイルファーストのため、まず小さい画面向けにデザインし、大きい画面向けに拡張します。

```typescript
// ✅ Good - モバイルファースト
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
</div>

// ❌ Bad - デスクトップファースト
<div className="p-8 md:p-6 sm:p-4"> {/* 逆順になっている */}
  <h1 className="text-4xl md:text-3xl sm:text-2xl">Title</h1>
</div>
```

### ブレークポイント

Tailwind CSS v4.1のデフォルトブレークポイント:

| Prefix | Min Width | Target Devices          |
| ------ | --------- | ----------------------- |
| sm:    | 640px     | スマートフォン（横向き）        |
| md:    | 768px     | タブレット                   |
| lg:    | 1024px    | デスクトップ                  |
| xl:    | 1280px    | 大型デスクトップ                |
| 2xl:   | 1536px    | 超大型ディスプレイ              |

### レスポンシブパターン

#### 1. レイアウト

```typescript
// グリッドレイアウト: モバイル1列、タブレット2列、デスクトップ3列
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id} {...item} />
  ))}
</div>

// フレックスレイアウト: モバイル縦並び、デスクトップ横並び
<div className="flex flex-col lg:flex-row gap-4">
  <aside className="lg:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

#### 2. タイポグラフィ

```typescript
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  見出し
</h1>

<p className="text-sm md:text-base lg:text-lg leading-relaxed">
  本文テキスト
</p>
```

#### 3. スペーシング

```typescript
// パディング: モバイル4、タブレット6、デスクトップ8
<section className="p-4 md:p-6 lg:p-8">

// マージン: 小さい画面では小さく、大きい画面では大きく
<div className="mt-4 md:mt-6 lg:mt-8">
```

#### 4. 表示/非表示

```typescript
// モバイルでハンバーガーメニュー、デスクトップでナビゲーション
<button className="lg:hidden">☰</button>
<nav className="hidden lg:flex gap-4">
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
```

### コンテナ幅の管理

```typescript
// 最大幅を設定して中央配置
<div className="container mx-auto px-4 max-w-7xl">
  <main>Content</main>
</div>

// セクションごとに異なる最大幅
<section className="max-w-4xl mx-auto px-4"> {/* 記事コンテンツ */}
<section className="max-w-7xl mx-auto px-4"> {/* ワイドコンテンツ */}
```

## Tailwind CSS Best Practices

### 1. ユーティリティクラスの組み合わせ

```typescript
// ✅ Good - ユーティリティクラスを組み合わせ
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Submit
</button>

// ❌ Bad - カスタムCSS（Tailwindがあるのに使わない）
<button className="custom-button">Submit</button>
```

### 2. 条件付きスタイル

```typescript
// ✅ Good - 動的クラス名
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-lg transition-colors',
    variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
    variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    isDisabled && 'opacity-50 cursor-not-allowed',
  )}
>
  Submit
</button>
```

`cn` ユーティリティ（`clsx` + `tailwind-merge`）:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3. コンポーネントバリアント

```typescript
// Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) => (
  <button
    className={cn(
      'rounded-lg font-medium transition-colors',
      variantStyles[variant],
      sizeStyles[size],
      className,
    )}
    {...props}
  />
);
```

### 4. 共通パターンの抽出

```typescript
// 頻繁に使うスタイルの組み合わせ
const cardStyles = 'p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow';
const inputStyles = 'px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

<div className={cardStyles}>
  <input className={inputStyles} />
</div>
```

## Accessibility (a11y)

### WCAG 2.1レベルAAを目標

#### 1. セマンティックHTML

```typescript
// ✅ Good - セマンティックな要素
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

<footer>
  <p>&copy; 2026</p>
</footer>

// ❌ Bad - divばかり
<div className="header">
  <div className="nav">
    <div className="link-container">
      <div className="link">Home</div>
    </div>
  </div>
</div>
```

#### 2. ARIAラベルとロール

```typescript
// ✅ Good - 適切なARIA属性
<button
  aria-label="閉じる"
  onClick={onClose}
>
  <CloseIcon aria-hidden="true" />
</button>

<nav aria-label="メインナビゲーション">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// 状態を伝える
<button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
>
  Menu
</button>

<div
  id="dropdown-menu"
  role="menu"
  aria-hidden={!isOpen}
>
  {/* メニュー項目 */}
</div>
```

#### 3. キーボードナビゲーション

すべてのインタラクティブ要素はキーボードで操作可能に。

```typescript
// ✅ Good - キーボード対応
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Custom Button
</div>

// ❌ Bad - キーボードで操作できない
<div onClick={handleClick}>
  Custom Button
</div>
```

ただし、可能な限り `<button>` を使用:

```typescript
// ✅ Better - ネイティブのbutton要素
<button onClick={handleClick}>
  Custom Button
</button>
```

#### 4. フォーカス管理

```typescript
// フォーカス可能な要素に明確なフォーカススタイル
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Submit
</button>

// カスタムフォーカススタイル
<a
  href="/about"
  className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
>
  About
</a>
```

#### 5. カラーコントラスト

WCAG AA基準:
- 通常テキスト: 4.5:1以上
- 大きなテキスト: 3:1以上

```typescript
// ✅ Good - 十分なコントラスト
<p className="text-gray-900 bg-white">High contrast text</p>
<p className="text-white bg-blue-600">High contrast on colored background</p>

// ❌ Bad - 低コントラスト
<p className="text-gray-400 bg-gray-300">Low contrast</p>
```

コントラストチェックツール:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools Lighthouse

#### 6. 代替テキスト

```typescript
// 画像には必ず代替テキスト
<img
  src="/diary-icon.png"
  alt="日記アイコン - ペンとノート"
/>

// 装飾的な画像は空のaltを指定
<img
  src="/decorative-pattern.png"
  alt=""
  aria-hidden="true"
/>

// アイコンとテキストの組み合わせ
<button>
  <PlusIcon aria-hidden="true" />
  <span>新規作成</span>
</button>

// アイコンのみの場合はaria-label
<button aria-label="新規作成">
  <PlusIcon aria-hidden="true" />
</button>
```

#### 7. フォームのアクセシビリティ

```typescript
// ✅ Good - ラベルと入力の関連付け
<div>
  <label htmlFor="email" className="block mb-2">
    Email
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? 'email-error' : undefined}
    className="px-4 py-2 border rounded"
  />
  {hasError && (
    <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">
      有効なメールアドレスを入力してください
    </p>
  )}
</div>

// ❌ Bad - ラベルなし、エラーの関連付けなし
<input
  type="email"
  placeholder="Email"
  className="px-4 py-2 border rounded"
/>
{hasError && <p className="text-red-600">Invalid email</p>}
```

#### 8. スキップリンク

長いナビゲーションをスキップしてメインコンテンツに移動。

```typescript
// layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white"
        >
          メインコンテンツへスキップ
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

スクリーンリーダー専用クラス:

```css
/* globals.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

#### 9. モーション・アニメーションの配慮

```typescript
// prefers-reduced-motionに対応
<button className="transition-transform hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
  Hover me
</button>

// CSSでも対応
<style jsx>{`
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`}</style>
```

### アクセシビリティチェックリスト

- [ ] セマンティックHTMLを使用
- [ ] すべての画像に代替テキスト
- [ ] フォーム要素にラベルを関連付け
- [ ] 十分なカラーコントラスト（4.5:1以上）
- [ ] キーボードのみで操作可能
- [ ] フォーカス可能な要素に明確なフォーカススタイル
- [ ] 適切なARIAラベルとロール
- [ ] エラーメッセージは読み上げ可能
- [ ] モーション削減設定に対応

### テストツール

1. **自動テスト**:
   - Storybookのa11yアドオン
   - axe-core (Playwright統合)

2. **手動テスト**:
   - キーボードのみで操作
   - スクリーンリーダー（NVDA, JAWS, VoiceOver）

3. **ブラウザツール**:
   - Chrome DevTools Lighthouse
   - axe DevTools拡張機能

## ダークモード対応（将来の拡張）

```typescript
// Tailwind CSSのダークモード設定
// tailwind.config.ts
export default {
  darkMode: 'class', // または 'media'
  // ...
}

// コンポーネントでの使用
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 className="text-2xl">Title</h1>
</div>
```

## パフォーマンス考慮事項

### 画像の最適化

```typescript
import Image from 'next/image';

// ✅ Good - Next.js Image コンポーネント
<Image
  src="/diary-photo.jpg"
  alt="日記の写真"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>

// ❌ Bad - 最適化なし
<img src="/diary-photo.jpg" alt="日記の写真" />
```

### レイアウトシフトの防止

```typescript
// ✅ Good - 明示的なサイズ指定
<div className="w-64 h-48">
  <Image src="/photo.jpg" alt="Photo" fill className="object-cover" />
</div>

// ❌ Bad - サイズ未指定でレイアウトシフト発生
<img src="/photo.jpg" alt="Photo" />
```

## まとめ

### デザインの3本柱

1. **レスポンシブデザイン**: モバイルファーストで、すべてのデバイスで最適な体験
2. **Tailwind CSS**: ユーティリティクラスで効率的にスタイリング
3. **アクセシビリティ**: すべてのユーザーが使えるインクルーシブなデザイン

これらの原則に従うことで、美しく、使いやすく、アクセシブルなアプリケーションを構築できます。
