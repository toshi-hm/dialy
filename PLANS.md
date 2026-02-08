# Dialy 実装TODO（設計書準拠）

最終更新: 2026-02-08

## 目的

`docs/` 配下の設計書を実装可能なTODOへ分解し、MVPからPhase 3までの開発順序を明確化する。

## 参照設計書

- `docs/00_INDEX.md`
- `docs/01_REQUIREMENTS.md`
- `docs/02_ARCHITECTURE.md`
- `docs/03_DATA_MODEL.md`
- `docs/04_UI_UX_DESIGN.md`
- `docs/05_FEATURES.md`
- `docs/06_SECURITY.md`
- `docs/07_PERFORMANCE.md`

## 現状スナップショット

- 実装済み: `src/app/page.tsx` の簡易トップ表示、`Button` atom、`src/lib/validations/diary.ts` の暫定スキーマ
- 未実装: 設計書で定義されたMVP機能の大半（Dial、日記CRUD、過去同日表示、自動保存、品質ゲート）

## 開発原則（TDD / DDD）

- TDD: 各タスクは `Red（失敗テスト） -> Green（最小実装） -> Refactor（設計改善） -> Regression（全テスト再実行）` の順で進める
- DDD: `Domain` が契約（Repository interface）とビジネスルールを保持し、`Application` はユースケース調停、`Infrastructure` は実装詳細に限定する
- ユビキタス言語: 要件用語とコード上の命名を1対1対応させ、差分をレビューで検出する

## Phase 0: 仕様整合（P0）

- [x] `P0-SPEC-01` 保存方式の矛盾解消: FR-02「明示的保存ボタン不要」と、UI/ユーザーストーリー内の「保存ボタン」記述を統一
- [x] `P0-SPEC-02` Dial主要操作の確定: MVPで「ドラッグ中心」か「カレンダー選択中心」かを決定
- [x] `P0-SPEC-03` レンダリング方針の整合: MVPはClient Component前提で固定（`07_PERFORMANCE.md` のServer Components優先記述との切り分け明文化）
- [x] `P0-SPEC-04` セキュリティ前提の整合: MVP（LocalStorage中心）でCSRF/Server Actions要件をどこまで適用するかを定義
- [x] `P0-SPEC-05` 受け入れ基準の更新: FR/NFRに対する実装完了条件（DoD）を1つの表に統合
- [x] `P0-SPEC-06` エラーメッセージ方針の統一: 日本語/英語、UI表示文言と例外文言の責務分離
- [x] `P0-SPEC-07` ユビキタス言語辞書を作成（`docs/DOMAIN_GLOSSARY.md`）し、要件用語とコード用語をマッピング
- [x] `P0-SPEC-08` 命名同期ルールをPRチェック項目に追加（用語集との差分確認を必須化）

## Phase 1: MVP実装

### 1.1 基盤・アーキテクチャ

- [x] `MVP-ARCH-01` `docs/02_ARCHITECTURE.md` のディレクトリ構造に沿って不足ディレクトリを作成（`molecules/organisms/templates/domain/use-cases/infrastructure/interfaces/utils/types`）
- [x] `MVP-ARCH-02` Atomic Design依存ルールを明文化（上位は下位のみ参照）
- [x] `MVP-ARCH-03` 共有型定義を `src/types/` に分離（API入力/出力、UI表示用）
- [x] `MVP-ARCH-04` 共通ユーティリティ作成（`date.ts`, `debounce.ts`, `cn.ts`）
- [x] `MVP-ARCH-05` エラー種別（バリデーション/保存失敗/未来日付/取得失敗）を型として定義

### 1.2 TDD運用（全タスク共通）

- [x] `MVP-TDD-01` Red: 実装着手前に失敗テストを追加し、失敗理由をコミットメッセージまたはPR説明に記録
- [x] `MVP-TDD-02` Green: テストを通す最小実装のみを追加（過剰実装を禁止）
- [x] `MVP-TDD-03` Refactor: 重複除去と責務整理を実施し、テストが通ることを維持
- [x] `MVP-TDD-04` Regression: 変更ごとに関連レイヤーの全テスト + `pnpm test` を再実行
- [x] `MVP-TDD-05` DoD: 失敗テスト先行の証跡、Green、Refactor結果、回帰結果の4点を完了条件に追加

### 1.3 Domain Layer

- [x] `MVP-DOM-01` `DiaryRepository` インターフェースを Domain層に定義（`src/lib/domain/interfaces/diary-repository.ts`）
- [x] `MVP-DOM-02` Red: `DiaryEntry` のドメインテストを先に作成（未来日付、文字数上限、更新時刻）
- [x] `MVP-DOM-03` Green: `DiaryEntry` エンティティ実装（UUID、未来日付禁止、1万文字制限、更新時`updatedAt`更新）
- [x] `MVP-DOM-04` Red: `DateValue` の値オブジェクトテストを先に作成（同月日判定、過去N年計算、表示フォーマット）
- [x] `MVP-DOM-05` Green: `DateValue` 値オブジェクト実装
- [x] `MVP-DOM-06` Red: `DiaryService` のドメインロジックテストを先に作成（同日取得・並び順）
- [x] `MVP-DOM-07` Green: `DiaryService` 実装
- [x] `MVP-DOM-08` Refactor/Regression: Domain層ユニットテスト全通し（目標カバレッジ100%）

### 1.4 Validation / Application Layer

- [x] `MVP-APP-01` Red: バリデーションスキーマの失敗テストを先に作成（未来日付、上限超過、ID形式）
- [x] `MVP-APP-02` Green: `src/lib/validations/diary.ts` を設計書準拠へ修正（`title/tags`暫定項目の扱い整理 + `Create/Update/Delete` スキーマ実装）
- [x] `MVP-APP-03` Red: UseCaseテストを先に作成（create/update/delete/get/get-entries-by-same-date）
- [x] `MVP-APP-04` Green: UseCase実装 `create-diary-entry.ts`
- [x] `MVP-APP-05` Green: UseCase実装 `update-diary-entry.ts`
- [x] `MVP-APP-06` Green: UseCase実装 `delete-diary-entry.ts`
- [x] `MVP-APP-07` Green: UseCase実装 `get-diary-entry.ts`
- [x] `MVP-APP-08` Green: UseCase実装 `get-entries-by-same-date.ts`
- [x] `MVP-APP-09` Refactor/Regression: Application層ユニットテスト全通し（目標カバレッジ90%以上）

### 1.5 Infrastructure Layer（LocalStorage）

- [x] `MVP-INF-01` Red: Repository契約テストを先に作成（保存/更新/削除/同日検索/重複防止）
- [x] `MVP-INF-02` Green: `LocalStorageDiaryRepository` 実装（`STORAGE_KEY=dialy_entries`, `version`付き）
- [x] `MVP-INF-03` Green: LocalStorageデータ復元・破損時フェイルセーフ実装
- [x] `MVP-INF-04` Green: 同日重複防止ロジック実装（1日1エントリー）
- [x] `MVP-INF-05` Green: `findBySameDate(date, years=5)` 実装（新しい順）
- [x] `MVP-INF-06` Green: メモリキャッシュとinvalidate実装（`07_PERFORMANCE.md`準拠）
- [x] `MVP-INF-07` Green: データバージョンチェックと将来マイグレーションの拡張ポイント実装
- [x] `MVP-INF-08` Refactor/Regression: Infrastructure層テスト全通し

### 1.6 Presentation Layer（Atomic Design）

- [x] `MVP-UI-T01` Red: 各コンポーネントの振る舞いテストを先に作成（表示、操作、a11y、状態遷移）
- [x] `MVP-UI-01` Atoms追加: `Input`
- [x] `MVP-UI-02` Atoms追加: `Text`
- [x] `MVP-UI-03` Atoms追加: `Icon`
- [x] `MVP-UI-04` Atoms追加: `Badge`
- [x] `MVP-UI-05` Molecules追加: `DateDisplay`
- [x] `MVP-UI-06` Molecules追加: `DiaryPreview`
- [x] `MVP-UI-07` Molecules追加: `CharacterCount`
- [x] `MVP-UI-08` Molecules追加: `SaveStatusIndicator`
- [x] `MVP-UI-09` Organisms追加: `Dial`（ドラッグ回転 + 未来日付禁止 + ARIA slider）
- [x] `MVP-UI-10` Organisms追加: `CalendarDialog`（MVP採用時）
- [x] `MVP-UI-11` Organisms追加: `DiaryEditor`（textarea / 1秒デバウンス保存 / 削除導線）
- [x] `MVP-UI-12` Organisms追加: `PastEntriesList`（過去5年、展開/折りたたみ）
- [x] `MVP-UI-13` Organisms追加: `DeleteConfirmDialog`
- [x] `MVP-UI-14` Organisms追加: `Header`
- [x] `MVP-UI-15` Template追加: `MainLayout`

### 1.7 画面統合・機能実装（FR-01〜FR-05）

- [x] `MVP-FR-01` 既定日付を「今日」に設定し `DateDisplay` に反映
- [x] `MVP-FR-02` Dial操作で日付変更し、当日日記・過去同日リストを再取得
- [x] `MVP-FR-03` 未来日付選択をUI/ロジック両面で禁止（カレンダー無効化 + Dial抑止）
- [x] `MVP-FR-04` 新規作成/既存編集を日付単位で自動判定
- [x] `MVP-FR-05` 自動保存（入力停止1秒）と保存状態表示（保存中/完了/失敗）
- [x] `MVP-FR-06` 削除確認ダイアログ経由で削除し、編集領域をクリア
- [x] `MVP-FR-07` 過去同日の日記を最大5件表示（存在年のみ）
- [x] `MVP-FR-08` `DiaryPreview` に年・100文字プレビュー・文字数を表示
- [x] `MVP-FR-09` PastEntriesカードの展開/折りたたみ実装
- [x] `MVP-FR-10` 文字数カウント表示と1万文字上限の入力制御
- [x] `MVP-FR-11` ローディングUI実装（初回/過去日記取得/自動保存中）
- [x] `MVP-FR-12` エラーUI実装（保存失敗/文字数超過/未来日付）
- [x] `MVP-FR-13` 保存失敗時の自動リトライ（最大3回、指数バックオフ）

### 1.8 レスポンシブ / アクセシビリティ / UX

- [x] `MVP-UX-01` ブレークポイント対応（mobile <=767, tablet 768-1023, desktop >=1024）
- [x] `MVP-UX-02` Dialサイズ最適化（80/150/180）と配置切替
- [x] `MVP-UX-03` テキストエリア高さ最適化（300/350/400）
- [x] `MVP-UX-04` キーボード操作対応（Tab移動、Enter/Space展開、Cmd/Ctrl+S）
- [x] `MVP-UX-05` ARIA属性実装（slider/textarea/button、`aria-live`通知）
- [ ] `MVP-UX-06` コントラスト要件（WCAG 2.1 AA）検証
- [ ] `MVP-UX-07` アニメーション実装（Dial 100ms、カード300ms、保存フィードバック）
- [ ] `MVP-UX-08` `prefers-reduced-motion` 対応

### 1.9 セキュリティ（MVP）

- [x] `MVP-SEC-01` Reactエスケープ前提を維持し `dangerouslySetInnerHTML` を禁止
- [x] `MVP-SEC-02` 入力検証をZod経由で統一（UI層直保存を禁止）
- [ ] `MVP-SEC-03` `next.config.ts` にセキュリティヘッダー設定（HSTS, CSP, X-Frame-Options等）
- [ ] `MVP-SEC-04` `.env.local` 管理ルールをREADMEに明記し `.gitignore` を確認
- [ ] `MVP-SEC-05` LocalStorage利用のセキュリティ注意点をユーザー向けに明記
- [ ] `MVP-SEC-06` MVPセキュリティチェックリスト（`docs/06_SECURITY.md`）を完了

### 1.10 パフォーマンス（MVP）

- [ ] `MVP-PERF-01` 初回表示3秒以内を測定しボトルネックを特定
- [ ] `MVP-PERF-02` Dial操作100ms未満・60fpsの計測を追加
- [x] `MVP-PERF-03` `React.memo`/`useMemo`/`useCallback` を適用
- [x] `MVP-PERF-04` 自動保存デバウンス1秒を共通utilで統一
- [x] `MVP-PERF-05` LocalStorageリポジトリにキャッシュ戦略を導入
- [ ] `MVP-PERF-06` Dynamic Importを重いUI（確認ダイアログ等）へ適用
- [ ] `MVP-PERF-07` Lighthouse目標（Performance 80+）のCI計測導入

### 1.11 統合テスト・Storybook・E2E

- [ ] `MVP-TEST-01` FR-01〜FR-05受け入れテストケースを文書化
- [ ] `MVP-TEST-02` Domain層100% / Application層90% / Presentation層60% の閾値設定
- [x] `MVP-TEST-03` 統合テスト作成（UseCase + Repository + UI連携）
- [x] `MVP-TEST-04` Storybook作成（Default/Variation/Edge/State）
- [ ] `MVP-TEST-05` Storybook a11yアドオンで自動検証
- [ ] `MVP-TEST-06` VRT（reg-suit）ベースラインを作成
- [ ] `MVP-TEST-07` Playwright導入とE2E基盤作成
- [ ] `MVP-TEST-08` E2E: 日記新規作成フロー
- [ ] `MVP-TEST-09` E2E: 日記編集フロー
- [ ] `MVP-TEST-10` E2E: 日記削除フロー（確認ダイアログ含む）
- [ ] `MVP-TEST-11` E2E: Dial操作と未来日付禁止
- [ ] `MVP-TEST-12` E2E: 過去同日リスト表示/展開
- [ ] `MVP-TEST-13` E2E: モバイル/デスクトップのレスポンシブ差分

### 1.12 CI / ドキュメント整備

- [ ] `MVP-CI-01` CIにカバレッジ閾値チェックを追加
- [ ] `MVP-CI-02` Lighthouse CIワークフロー追加
- [ ] `MVP-CI-03` E2Eジョブ（PR時または夜間）追加
- [ ] `MVP-DOC-01` READMEを実装状態に合わせて更新（起動/構成/テスト手順）
- [ ] `MVP-DOC-02` コンポーネント設計ガイド（Atomic Design運用）追記
- [ ] `MVP-DOC-03` 仕様差分管理ルール（設計書と実装の同期手順）を追加
- [x] `MVP-DOC-04` ユビキタス言語辞書とコード命名の差分レビューを定例化

## Phase 2: サーバー移行・機能拡張

### 2.1 データ基盤移行

- [ ] `P2-DATA-01` `prisma/schema.prisma` 実装（`DiaryEntry`, `User`, index）
- [ ] `P2-DATA-02` `PrismaDiaryRepository` 実装
- [ ] `P2-DATA-03` LocalStorage -> Prismaマイグレーション機能実装
- [ ] `P2-DATA-04` Server Actions / API Routes へ保存・取得処理を移行
- [ ] `P2-DATA-05` キャッシュ再検証（`revalidateTag`）導入

### 2.2 認証・認可・セキュリティ強化

- [ ] `P2-SEC-01` NextAuth.js または Auth0導入
- [ ] `P2-SEC-02` ユーザー単位アクセス制御（自分の日記のみ）
- [ ] `P2-SEC-03` セッション管理強化（Secure Cookie）
- [ ] `P2-SEC-04` データ暗号化（AES-256-GCM）方針確定と実装
- [ ] `P2-SEC-05` 監査ログ・レート制限導入

### 2.3 機能拡張（FR-06〜FR-10）

- [ ] `P2-FEAT-01` 検索・フィルタリング（全文/タグ/日付範囲）
- [ ] `P2-FEAT-02` マークダウン編集 + 安全なサニタイズ
- [ ] `P2-FEAT-03` 画像添付（最大5枚、サムネイル、アップロード導線）
- [ ] `P2-FEAT-04` タグ機能（作成・複数付与・表示）
- [ ] `P2-FEAT-05` エクスポート（JSON/Markdown/PDF）

### 2.4 パフォーマンス高度化

- [ ] `P2-PERF-01` Server Components優先構成へ移行
- [ ] `P2-PERF-02` Suspense + ストリーミング導入
- [ ] `P2-PERF-03` React Query/SWR導入検証
- [ ] `P2-PERF-04` バンドル分析と継続最適化（Performance 90+）
- [ ] `P2-PERF-05` エラー監視（Sentry等）導入

## Phase 3: 長期拡張

- [ ] `P3-01` PWA化（オフライン閲覧・編集）
- [ ] `P3-02` マルチユーザー/複数デバイス同期
- [ ] `P3-03` リアルタイム同期（WebSocket/SSE）
- [ ] `P3-04` 統計・分析機能
- [ ] `P3-05` リマインダー機能
- [ ] `P3-06` AI要約・振り返り提案
- [ ] `P3-07` 多要素認証（MFA）

## FR/NFRトレーサビリティ

| 要件 | 対応タスク |
| --- | --- |
| FR-01 日付選択 | `MVP-UI-09`, `MVP-FR-01`, `MVP-FR-02`, `MVP-FR-03` |
| FR-02 日記作成 | `MVP-APP-04`, `MVP-FR-04`, `MVP-FR-05` |
| FR-03 日記編集 | `MVP-APP-05`, `MVP-FR-04`, `MVP-FR-05` |
| FR-04 過去同日表示 | `MVP-APP-08`, `MVP-FR-07`, `MVP-FR-08`, `MVP-FR-09` |
| FR-05 日記削除 | `MVP-APP-06`, `MVP-UI-13`, `MVP-FR-06` |
| FR-06〜10 将来拡張 | `P2-FEAT-01` 〜 `P2-FEAT-05` |
| NFR-01/02/03 性能 | `MVP-PERF-01` 〜 `MVP-PERF-07` |
| NFR-04/05/06 UX/A11y/ブラウザ | `MVP-UX-01` 〜 `MVP-UX-08`, `MVP-TEST-13` |
| NFR-07/08/09 セキュリティ | `MVP-SEC-01` 〜 `MVP-SEC-06`, `P2-SEC-*` |
| NFR-10 品質 | `MVP-TEST-02`, `MVP-CI-01` |
| NFR-11 ドキュメント | `MVP-DOC-01` 〜 `MVP-DOC-04` |
| NFR-12 オフライン（将来） | `P3-01` |
