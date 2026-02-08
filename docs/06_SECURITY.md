# セキュリティ設計

## 目次
- [1. セキュリティ概要](#1-セキュリティ概要)
- [2. 認証・認可（将来実装）](#2-認証認可将来実装)
- [3. データ保護](#3-データ保護)
- [4. プライバシー保護](#4-プライバシー保護)
- [5. 入力検証](#5-入力検証)
- [6. セキュリティヘッダー](#6-セキュリティヘッダー)
- [7. 脅威モデル](#7-脅威モデル)
- [8. セキュリティチェックリスト](#8-セキュリティチェックリスト)

## 1. セキュリティ概要

### 1.1 セキュリティ方針

本アプリケーションは個人の日記を扱うため、以下のセキュリティ原則を遵守する:

1. **プライバシー第一**: ユーザーの日記は個人情報として厳重に保護
2. **最小権限の原則**: 必要最小限のアクセス権のみ付与
3. **深層防御**: 複数層のセキュリティ対策を実施
4. **セキュアバイデフォルト**: デフォルトで安全な設定
5. **透明性**: セキュリティポリシーを明確に開示

### 1.2 セキュリティレベル

| レベル | 対象 | 実装時期 |
|-------|------|---------|
| L1: 基本 | XSS対策、CSRF対策、入力検証 | MVP版 |
| L2: 標準 | HTTPS強制、セキュリティヘッダー | MVP版 |
| L3: 高度 | 認証・認可、暗号化 | 将来実装 |
| L4: 最高 | 多要素認証、監査ログ | 長期実装 |

## 2. 認証・認可（将来実装）

### 2.1 認証方式

#### MVP版: 認証なし

MVP版では以下の理由により認証機能を実装しません:

- **データ保存**: LocalStorage（ブラウザローカル）のため、マルチユーザー不要
- **プライバシー**: ブラウザ内で完結するため、サーバー側での認証不要
- **シンプルさ**: 認証なしで即座に使用開始できる

**セキュリティ考慮事項**:
- LocalStorageは同一オリジンでのみアクセス可能（ブラウザのセキュリティ機構）
- XSS攻撃からの保護（Reactのデフォルトエスケープ）
- ユーザーは自身のブラウザで完全にデータを管理

#### 将来版（Phase 2）: NextAuth.js または Auth0

将来的にサーバーDBに移行する際は、以下の認証方式を検討:

#### オプション1: NextAuth.js

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub!;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

#### オプション2: Auth0

```typescript
import { Auth0Provider } from '@auth0/auth0-react';

<Auth0Provider
  domain={process.env.AUTH0_DOMAIN!}
  clientId={process.env.AUTH0_CLIENT_ID!}
  redirectUri={window.location.origin}
>
  <App />
</Auth0Provider>
```

### 2.2 認可（アクセス制御）

#### ルール

1. **ユーザー自身の日記のみアクセス可能**
   - 他のユーザーの日記は閲覧・編集不可

2. **ロールベースアクセス制御（RBAC）** - 将来実装
   - `user`: 自分の日記の作成・編集・削除
   - `admin`: すべての日記の閲覧（管理者のみ）

#### 実装例

```typescript
// ミドルウェアでアクセスチェック
export async function middleware(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ユーザー自身の日記のみアクセス許可
  const entryId = request.nextUrl.pathname.split('/').pop();
  const entry = await getDiaryEntry(entryId);

  if (entry.userId !== session.user.id) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}
```

## 3. データ保護

### 3.1 HTTPS強制

すべての通信をHTTPS経由で行う。

#### Next.js設定

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};
```

#### リダイレクト設定

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // HTTP → HTTPS リダイレクト（本番環境のみ）
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }

  return NextResponse.next();
}
```

### 3.2 環境変数の管理

機密情報は環境変数で管理し、コードにハードコードしない。

#### .env.local（Gitに含めない）

```
# データベース接続文字列
DATABASE_URL="postgresql://user:password@localhost:5432/dialy"

# NextAuth.js（将来）
NEXTAUTH_SECRET="ランダムな秘密鍵"
NEXTAUTH_URL="https://dialy.example.com"

# OAuth（将来）
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
```

#### .gitignore

```
.env.local
.env.*.local
```

### 3.3 データベース暗号化（将来）

Prismaを導入後、データベースレベルでの暗号化を検討。

#### 暗号化対象
- 日記の本文（content）
- ユーザーのメールアドレス（将来）

#### 暗号化方式
- AES-256-GCM
- フィールドレベル暗号化

```typescript
// 暗号化ユーティリティ
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32バイトのキー
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 3.4 LocalStorageのセキュリティ（MVP版）

MVP版ではLocalStorageを使用するが、以下の点に注意:

1. **XSS対策**: Reactのデフォルトエスケープに依存
2. **暗号化**: 可能であればWeb Crypto APIで暗号化
3. **有効期限**: なし（ユーザーが削除するまで保持）

#### LocalStorage暗号化（オプション）

```typescript
// Web Crypto APIを使用した暗号化
async function encryptForStorage(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(data);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('dialy-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const encryptedArray = new Uint8Array(encrypted);
  const result = new Uint8Array(iv.length + encryptedArray.length);
  result.set(iv);
  result.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...result));
}
```

## 4. プライバシー保護

### 4.1 データ最小化

必要最小限のデータのみ収集・保存する。

#### 収集データ（MVP版）

| データ | 収集理由 | 保存期間 |
|-------|---------|---------|
| 日記の日付 | 日記の識別 | 無制限 |
| 日記の本文 | 日記の内容 | 無制限 |
| 作成日時 | 監査・デバッグ | 無制限 |
| 更新日時 | 監査・デバッグ | 無制限 |

#### 収集しないデータ
- ユーザーの閲覧履歴
- IPアドレス（ログ以外）
- デバイス情報（必要最小限のみ）

### 4.2 データ削除権

ユーザーは自分のデータをいつでも削除できる。

#### 実装（将来）

```typescript
// すべてのデータを削除
export async function deleteAllUserDataUseCase(userId: string): Promise<void> {
  await prisma.$transaction([
    // すべての日記を削除
    prisma.diaryEntry.deleteMany({ where: { userId } }),
    // ユーザーアカウントを削除
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
```

### 4.3 プライバシーポリシー

プライバシーポリシーページを設置（将来実装）。

## 5. 入力検証

### 5.1 クライアント側検証

Zodスキーマで入力を検証。

```typescript
// src/lib/validations/diary.ts
import { z } from 'zod';

export const DiaryEntrySchema = z.object({
  date: z.date().refine(
    (date) => date <= new Date(),
    { message: 'Future date is not allowed' }
  ),
  content: z.string()
    .max(10000, 'Content exceeds maximum length'),
});
```

### 5.2 サーバー側検証

Server Actionsでも再検証（クライアント側検証を信用しない）。

```typescript
// app/actions/diary.ts
'use server';

import { DiaryEntrySchema } from '@/lib/validations/diary';

export async function createDiaryAction(formData: FormData) {
  const rawData = {
    date: new Date(formData.get('date') as string),
    content: formData.get('content') as string,
  };

  // サーバー側で再検証
  const validated = DiaryEntrySchema.parse(rawData);

  // ユースケース実行
  await createDiaryEntryUseCase.execute(validated);
}
```

### 5.3 XSS対策

Reactのデフォルトエスケープに依存。

```typescript
// ✅ Good - Reactが自動的にエスケープ
<p>{entry.content}</p>

// ❌ Bad - dangerouslySetInnerHTMLは使わない
<p dangerouslySetInnerHTML={{ __html: entry.content }} />
```

将来的にマークダウン対応する場合は、サニタイゼーションライブラリを使用:

```typescript
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(markdownToHTML(entry.content));
```

### 5.4 SQL Injection対策

Prisma ORMを使用することで、自動的にパラメータ化されたクエリが生成される。

```typescript
// ✅ Good - Prismaはパラメータ化されたクエリを生成
await prisma.diaryEntry.findUnique({
  where: { id: entryId },
});

// ❌ Bad - 生のSQLは使わない
await prisma.$queryRaw`SELECT * FROM diary_entries WHERE id = ${entryId}`;
```

### 5.5 CSRF対策

Next.jsのServer Actionsが自動的にCSRF対策を提供。

## 6. セキュリティヘッダー

### 6.1 HTTP セキュリティヘッダー

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // HSTS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // XSS Protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Clickjacking Protection
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // CSP (Content Security Policy)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.jsの要件
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self'",
            ].join('; '),
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
};
```

### 6.2 CSP詳細

Content Security Policy（CSP）で許可するリソースを制限。

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self';
```

将来的にはNonceベースのCSPに移行を検討。

## 7. 脅威モデル

### 7.1 想定される脅威

| 脅威 | リスクレベル | 対策 |
|------|------------|------|
| XSS攻撃 | 中 | Reactのデフォルトエスケープ |
| CSRF攻撃 | 中 | Server Actionsの自動対策 |
| SQL Injection | 低 | Prisma ORM使用 |
| セッションハイジャック | 高（将来） | HTTPS強制、セキュアCookie |
| 不正アクセス | 高（将来） | 認証・認可の実装 |
| データ漏洩 | 高 | 暗号化、アクセス制御 |
| DoS攻撃 | 中 | レート制限（将来） |

### 7.2 攻撃シナリオと対策

#### シナリオ1: XSS攻撃

**攻撃**: 悪意のあるスクリプトを日記に埋め込み、他のユーザーのブラウザで実行

**対策**:
- Reactのデフォルトエスケープ
- CSPヘッダーでインラインスクリプトを制限
- DOMPurifyでサニタイゼーション（マークダウン対応時）

#### シナリオ2: 不正アクセス（将来）

**攻撃**: 認証をバイパスして他人の日記にアクセス

**対策**:
- NextAuth.jsによる認証
- ミドルウェアでアクセス制御
- セッショントークンの検証

#### シナリオ3: データ漏洩

**攻撃**: LocalStorageまたはデータベースからデータを盗む

**対策**:
- HTTPS強制
- データ暗号化（将来）
- アクセスログの記録（将来）

## 8. セキュリティチェックリスト

### 8.1 MVP版チェックリスト

- [ ] XSS対策: Reactのデフォルトエスケープを使用
- [ ] CSRF対策: Server Actionsを使用
- [ ] 入力検証: Zodスキーマで検証
- [ ] HTTPS強制: セキュリティヘッダー設定
- [ ] CSP設定: Content Security Policyヘッダー
- [ ] 環境変数: 機密情報を.env.localで管理
- [ ] .gitignore: .env.localを除外

### 8.2 将来実装チェックリスト

- [ ] 認証: NextAuth.jsまたはAuth0導入
- [ ] 認可: ユーザー自身の日記のみアクセス可能
- [ ] データ暗号化: AES-256-GCMで暗号化
- [ ] セッション管理: セキュアなセッションCookie
- [ ] レート制限: DoS攻撃対策
- [ ] 監査ログ: アクセスログの記録
- [ ] 多要素認証: 2FAの導入（長期）
- [ ] セキュリティ監視: 不正アクセスの検知

### 8.3 定期的なセキュリティレビュー

- [ ] 依存関係の脆弱性チェック（`npm audit`）
- [ ] セキュリティヘッダーの検証（securityheaders.com）
- [ ] OWASP Top 10のチェック
- [ ] ペネトレーションテスト（将来）

## 9. インシデント対応

### 9.1 セキュリティインシデント対応フロー

```
インシデント発生
 ↓
1. 検知・報告
 ↓
2. 影響範囲の特定
 ↓
3. 一時的な対策（サービス停止など）
 ↓
4. 根本原因の調査
 ↓
5. 恒久的な対策の実施
 ↓
6. ユーザーへの通知
 ↓
7. 事後レビュー
 ↓
終了
```

### 9.2 連絡先

セキュリティに関する問題を発見した場合:

```
Email: security@dialy.example.com（将来設置）
```

## まとめ

- **MVP版**: 基本的なセキュリティ対策（XSS、CSRF、HTTPS）
- **将来実装**: 認証・認可、データ暗号化、監査ログ
- **継続的改善**: 定期的なセキュリティレビューと脆弱性対応
- **透明性**: セキュリティポリシーの明確な開示
