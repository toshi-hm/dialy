# ユビキタス言語辞書（MVP）

## 目的
要件で使う用語とコード上の命名を1対1で対応させ、設計と実装の差分を減らす。

## 用語マッピング

| 要件用語 | 意味 | コード用語 | 配置 |
|---------|------|-----------|------|
| 日記エントリー | 1日分の日記データ | `DiaryEntry` | `src/lib/domain/diary-entry.ts` |
| 日付値 | 日付操作を持つ値オブジェクト | `DateValue` | `src/lib/domain/date-value.ts` |
| 日記リポジトリ | 日記データ永続化の抽象 | `DiaryRepository` | `src/lib/domain/interfaces/diary-repository.ts` |
| LocalStorage実装 | MVPの永続化実装 | `LocalStorageDiaryRepository` | `src/lib/infrastructure/local-storage-diary-repository.ts` |
| 日記作成 | 新規エントリー作成フロー | `CreateDiaryEntryUseCase` | `src/lib/use-cases/create-diary-entry.ts` |
| 日記更新 | 既存エントリー更新フロー | `UpdateDiaryEntryUseCase` | `src/lib/use-cases/update-diary-entry.ts` |
| 日記削除 | エントリー削除フロー | `DeleteDiaryEntryUseCase` | `src/lib/use-cases/delete-diary-entry.ts` |
| 日記取得 | 1件取得フロー | `GetDiaryEntryUseCase` | `src/lib/use-cases/get-diary-entry.ts` |
| 過去同日取得 | 同月同日の過去N年取得 | `GetEntriesBySameDateUseCase` | `src/lib/use-cases/get-entries-by-same-date.ts` |
| Dial | 日付を前後移動するUI | `Dial` | `src/components/organisms/Dial/` |
| 日付表示 | 選択日を表示するUI | `DateDisplay` | `src/components/molecules/DateDisplay/` |
| 日記編集エリア | 本文入力UI | `DiaryEditor` | `src/components/organisms/DiaryEditor/` |
| 過去同日リスト | 過去の日記表示UI | `PastEntriesList` | `src/components/organisms/PastEntriesList/` |
| 文字数カウント | 本文文字数の表示 | `CharacterCount` | `src/components/molecules/CharacterCount/` |
| 保存状態表示 | 保存中/完了/失敗の表示 | `SaveStatusIndicator` | `src/components/molecules/SaveStatusIndicator/` |
| 自動保存 | 入力停止1秒後に保存 | `debounce` + `save` フロー | `src/lib/utils/debounce.ts` 他 |
| 未来日付禁止 | 今日より先の日付を拒否 | `FutureDateError` / バリデーション | `src/types/errors.ts` 他 |

## 命名ルール

- 要件用語の英語化はこの辞書を唯一の正とする。
- 同義語（例: `Entry` と `Diary` の混在）は避ける。
- エラーコードは `UPPER_SNAKE_CASE`、型名は `PascalCase`、変数/関数は `camelCase`。
- UI表示文言は日本語、例外メッセージは英語で分離する。

## 更新ルール

- 要件変更が入るPRでは、この辞書の差分確認を必須にする。
- 新しいドメイン概念を追加した場合、実装前にこの辞書へ先に追記する。
