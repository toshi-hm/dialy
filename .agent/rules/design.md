---
trigger: always_on
glob: src/components/**/*.{ts,tsx},src/app/**/*.{ts,tsx}
description: レスポンシブデザイン、Tailwind CSS、アクセシビリティに関するガイドライン。
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

#### 2. 表示/非表示

```typescript
// モバイルでハンバーガーメニュー、デスクトップでナビゲーション
<button className="lg:hidden">☰</button>
<nav className="hidden lg:flex gap-4">
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
```

## Tailwind CSS Best Practices

### 1. 条件付きスタイル

```typescript
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

### 2. コンポーネントバリアント

```typescript
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
```

#### 3. キーボードナビゲーション

すべてのインタラクティブ要素はキーボードで操作可能に。可能な限り `<button>` を使用。

```typescript
// ✅ Good - ネイティブのbutton要素
<button onClick={handleClick}>
  Custom Button
</button>

// ❌ Bad - キーボードで操作できない
<div onClick={handleClick}>
  Custom Button
</div>
```

#### 4. フォーカス管理

```typescript
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Submit
</button>
```

#### 5. カラーコントラスト

WCAG AA基準:
- 通常テキスト: 4.5:1以上
- 大きなテキスト: 3:1以上

#### 6. フォームのアクセシビリティ

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
  />
  {hasError && (
    <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">
      有効なメールアドレスを入力してください
    </p>
  )}
</div>
```

#### 7. モーション・アニメーションの配慮

```typescript
// prefers-reduced-motionに対応
<button className="transition-transform hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
  Hover me
</button>
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

## まとめ

### デザインの3本柱

1. **レスポンシブデザイン**: モバイルファーストで、すべてのデバイスで最適な体験
2. **Tailwind CSS**: ユーティリティクラスで効率的にスタイリング
3. **アクセシビリティ**: すべてのユーザーが使えるインクルーシブなデザイン

これらの原則に従うことで、美しく、使いやすく、アクセシブルなアプリケーションを構築できます。
