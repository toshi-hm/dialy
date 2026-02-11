# 機能仕様

## 目次
- [1. Dial操作による日付選択](#1-dial操作による日付選択)
- [2. 日記の作成](#2-日記の作成)
- [3. 日記の編集](#3-日記の編集)
- [4. 日記の削除](#4-日記の削除)
- [5. 過去の同じ日の日記表示](#5-過去の同じ日の日記表示)
- [6. 自動保存](#6-自動保存)
- [7. 文字数カウント](#7-文字数カウント)
- [8. エラーハンドリング](#8-エラーハンドリング)

## 1. Dial操作による日付選択

### 1.1 機能概要

Dial（円形のコントロール）をドラッグ回転させることで、日付を直感的に選択できる機能。

### 1.2 仕様詳細

#### 入力方法

**主要操作: カレンダーから日付選択**
- **クリック/タップ**: Dialをクリック/タップ
- **カレンダー表示**: カレンダーダイアログが表示される
- **日付範囲**: 過去の任意の日付を選択可能（未来は不可）

**補助操作: Dialで前後移動**
- **ドラッグ操作**: マウス/タッチでDialをドラッグ
- **回転方向**:
  - 時計回り → 翌日
  - 反時計回り → 前日
- **連続回転**: 連続して回すことで高速スクロール可能

#### 処理（カレンダー選択）
1. Dialをクリック/タップ
2. カレンダーダイアログを表示
3. ユーザーが日付を選択
4. 日付の妥当性チェック（未来の日付は不可）
5. 日付を更新

#### 処理（Dial回転）
1. ドラッグ開始位置を記録
2. ドラッグ中の座標から回転角度を計算
3. 回転方向を判定（時計回り/反時計回り）
4. 現在選択中の日付に1日加減算
5. 日付の妥当性チェック（未来の日付は不可）
6. 日付を更新

#### 出力
- 選択された日付（Date型）
- 日付変更イベント（onDateChangeコールバック）

#### 制約
- 未来の日付は選択不可（今日まで）
- 過去の日付は無制限

### 1.3 ユースケース

#### 正常系

**ケース1: カレンダーから過去の日付を選択**

```
前提条件: 現在の選択日付が2026年2月8日
操作:
  1. Dialをクリック/タップ
  2. カレンダーダイアログが表示される
  3. 2025年2月8日を選択
結果: 日付が2025年2月8日に変更される
```

**ケース2: Dialで1日前の日付に移動**

```
前提条件: 現在の選択日付が2026年2月8日
操作: Dialを反時計回りに回転（1回）
結果: 日付が2026年2月7日に変更される
```

**ケース3: Dialで連続回転して1週間前に移動**

```
前提条件: 現在の選択日付が2026年2月8日
操作: Dialを反時計回りに連続して7回回転
結果: 日付が2026年2月1日に変更される
```

#### 異常系

**ケース4: 未来の日付を選択しようとする（カレンダー）**

```
前提条件: 今日は2026年2月8日
操作: カレンダーで2026年2月9日を選択しようとする
結果: 未来の日付は選択不可（グレーアウトまたは選択できない）
```

**ケース5: 未来の日付に移動しようとする（Dial）**

```
前提条件: 現在の選択日付が2026年2月8日（今日）
操作: Dialを時計回りに回転
結果: 日付は変更されず、何も起こらない
```

### 1.4 実装アルゴリズム

```typescript
type DialProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  maxDate?: Date; // デフォルト: 今日
}

function Dial({ selectedDate, onDateChange, maxDate = new Date() }: DialProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  // クリック: カレンダー表示
  const handleClick = () => {
    if (!isDragging) {
      setShowCalendar(true);
    }
  };

  // カレンダーから日付選択
  const handleDateSelect = (date: Date) => {
    if (date <= maxDate) {
      onDateChange(date);
      setShowCalendar(false);
    }
  };

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const angle = calculateAngle(e.clientX, e.clientY);
    setStartAngle(angle);
  };

  // ドラッグ中: 前後移動
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const currentAngle = calculateAngle(e.clientX, e.clientY);
    const deltaAngle = currentAngle - startAngle;

    // 回転方向を判定（閾値: 30度）
    if (Math.abs(deltaAngle) > 30) {
      const newDate = new Date(selectedDate);

      if (deltaAngle > 0) {
        // 時計回り: 翌日
        newDate.setDate(newDate.getDate() + 1);
      } else {
        // 反時計回り: 前日
        newDate.setDate(newDate.getDate() - 1);
      }

      // 未来の日付チェック
      if (newDate <= maxDate) {
        onDateChange(newDate);
        setStartAngle(currentAngle);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 中心点からの角度を計算
  const calculateAngle = (x: number, y: number): number => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return 0;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    return angle;
  };

  return (
    <>
      <div
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Dial UI */}
      </div>
      {showCalendar && (
        <CalendarDialog
          selectedDate={selectedDate}
          maxDate={maxDate}
          onSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </>
  );
}
```

### 1.5 将来的な拡張

- **キーボード操作**: 矢印キーで日付変更
- **クリック選択**: Dialクリックでカレンダーダイアログ表示
- **スワイプジェスチャー**: モバイルでスワイプして日付変更
- **日付範囲制限**: 設定で選択可能な日付範囲を制限

## 2. 日記の作成

### 2.1 機能概要

選択した日付の日記を新規作成する機能。

### 2.2 仕様詳細

#### 入力
- **日付**: 選択された日付（Dialまたはカレンダーから）
- **本文**: テキストエリアに入力されたテキスト

#### 処理
1. 選択した日付に既に日記が存在するかチェック
2. 存在する場合: 編集モードに切り替え
3. 存在しない場合: 新規作成モード
4. テキスト入力に応じて自動保存（入力停止後1秒）
5. 保存状態を視覚的にフィードバック（「✓ 保存しました」表示）

#### 出力
- 作成された日記エントリー（DiaryEntry）
- 保存成功/失敗のフィードバック

#### 制約
- 1日につき1つの日記のみ作成可能
- 本文は10,000文字まで
- 未来の日付の日記は作成不可

### 2.3 ユースケース

#### 正常系

**ケース1: 新規日記を作成**

```
前提条件: 2026年2月8日の日記が存在しない
操作:
  1. 日付を2026年2月8日に選択
  2. テキストエリアに「今日は設計書を作成した」と入力
  3. 入力停止後1秒で自動保存が実行される
結果:
  - 日記が自動保存される
  - 「✓ 保存しました」のフィードバック表示
```

#### 異常系

**ケース2: 既に日記が存在する日付に作成しようとする**

```
前提条件: 2026年2月8日の日記が既に存在
操作:
  1. 日付を2026年2月8日に選択
結果:
  - 既存の日記がテキストエリアに表示される（編集モード）
  - 新規作成ではなく編集として扱われる
```

### 2.4 フロー図

```
開始
 ↓
日付を選択
 ↓
その日の日記が存在するか？
 ├─ Yes → 編集モードへ（3. 日記の編集を参照）
 └─ No  ↓
テキストエリアにフォーカス
 ↓
テキスト入力
 ↓
入力停止後1秒
 ↓
自動保存
 ↓
保存完了
 ↓
「✓ 保存しました」フィードバック表示
 ↓
自動保存継続（次回の入力停止時）
 ↓
終了
```

### 2.5 実装例

```typescript
// src/lib/use-cases/create-diary-entry.ts
export class CreateDiaryEntryUseCase {
  constructor(private repository: DiaryRepository) {}

  async execute(input: { date: Date; content: string }): Promise<DiaryEntry> {
    // 1. 既存チェック
    const existing = await this.repository.findByDate(input.date);
    if (existing) {
      throw new Error('An entry for this date already exists');
    }

    // 2. バリデーション
    const validated = CreateDiaryEntrySchema.parse(input);

    // 3. エンティティ作成
    const entry = DiaryEntry.create(validated.date, validated.content);

    // 4. 保存
    await this.repository.save(entry);

    return entry;
  }
}
```

## 3. 日記の編集

### 3.1 機能概要

既存の日記の本文を編集する機能。

### 3.2 仕様詳細

#### 入力
- **日記ID**: 編集対象の日記のID
- **新しい本文**: 編集後のテキスト

#### 処理
1. 日記IDで既存の日記を取得
2. 存在チェック
3. 新しい本文でエンティティを更新
4. バリデーション
5. 保存

#### 出力
- 更新された日記エントリー
- 保存成功/失敗のフィードバック

#### 制約
- 本文は10,000文字まで
- 日付は変更不可

### 3.3 ユースケース

#### 正常系

**ケース1: 既存の日記を編集**

```
前提条件: 2026年2月8日の日記が存在
操作:
  1. 日付を2026年2月8日に選択
  2. 既存の日記がテキストエリアに表示される
  3. 「設計書を作成した。とても楽しかった。」と追記
  4. 保存ボタンをクリック
結果:
  - 日記が更新される
  - 「保存しました」のフィードバック表示
  - updatedAtが更新される
```

### 3.4 実装例

```typescript
// src/lib/use-cases/update-diary-entry.ts
export class UpdateDiaryEntryUseCase {
  constructor(private repository: DiaryRepository) {}

  async execute(input: { id: string; content: string }): Promise<DiaryEntry> {
    // 1. 既存取得
    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new Error('Diary entry not found');
    }

    // 2. バリデーション
    const validated = UpdateDiaryEntrySchema.parse(input);

    // 3. 更新
    const updated = existing.update(validated.content);

    // 4. 保存
    await this.repository.save(updated);

    return updated;
  }
}
```

## 4. 日記の削除

### 4.1 機能概要

作成した日記を削除する機能。

### 4.2 仕様詳細

#### 入力
- **日記ID**: 削除対象の日記のID

#### 処理
1. 削除確認ダイアログを表示
2. ユーザーが確認
3. 日記を削除
4. テキストエリアをクリア

#### 出力
- 削除成功のフィードバック
- テキストエリアのクリア

#### 制約
- 削除後は復元不可

### 4.3 ユースケース

#### 正常系

**ケース1: 日記を削除**

```
前提条件: 2026年2月8日の日記が存在
操作:
  1. 日付を2026年2月8日に選択
  2. 削除ボタンをクリック
  3. 確認ダイアログで「削除」をクリック
結果:
  - 日記が削除される
  - テキストエリアがクリアされる
  - 「削除しました」のフィードバック表示
```

#### 異常系

**ケース2: 削除をキャンセル**

```
前提条件: 2026年2月8日の日記が存在
操作:
  1. 日付を2026年2月8日に選択
  2. 削除ボタンをクリック
  3. 確認ダイアログで「キャンセル」をクリック
結果:
  - 日記は削除されない
  - そのまま編集画面に戻る
```

### 4.4 実装例

```typescript
// src/lib/use-cases/delete-diary-entry.ts
export class DeleteDiaryEntryUseCase {
  constructor(private repository: DiaryRepository) {}

  async execute(input: { id: string }): Promise<void> {
    // 1. 存在チェック
    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new Error('Diary entry not found');
    }

    // 2. 削除
    await this.repository.delete(input.id);
  }
}
```

## 5. 過去の同じ日の日記表示

### 5.1 機能概要

選択した日付の過去5年分の同じ月日の日記をリスト表示する機能。

### 5.2 仕様詳細

#### 入力
- **日付**: 選択された日付

#### 処理
1. 選択した日付の月日を取得
2. 過去5年分の同じ月日の日付を計算
3. 各日付の日記を取得
4. 存在するもののみをリスト化
5. 新しい順（直近の年から）にソート
6. リスト表示

#### 出力
- 過去の日記エントリー配列（新しい順）

#### 制約
- 過去5年分まで
- 存在しない年は表示しない

### 5.3 ユースケース

#### 正常系

**ケース1: 過去3年分の日記が存在**

```
前提条件:
  - 2026年2月8日を選択
  - 2025年2月8日、2024年2月8日、2022年2月8日の日記が存在
  - 2023年2月8日、2021年2月8日の日記は存在しない
結果:
  - 3件の日記がリスト表示される
  - 表示順: 2025年 → 2024年 → 2022年
```

**ケース2: 過去の日記が存在しない**

```
前提条件: 2026年2月8日を選択、過去の同じ日の日記が存在しない
結果:
  - 「過去の同じ日の日記はありません」と表示
```

### 5.4 フロー図

```
開始
 ↓
日付を選択
 ↓
月日を取得（例: 2月8日）
 ↓
過去5年分の日付を計算
 ├─ 2025年2月8日
 ├─ 2024年2月8日
 ├─ 2023年2月8日
 ├─ 2022年2月8日
 └─ 2021年2月8日
 ↓
各日付の日記を取得
 ↓
存在するもののみフィルタリング
 ↓
新しい順にソート
 ↓
リスト表示
 ↓
終了
```

### 5.5 実装例

```typescript
// src/lib/use-cases/get-entries-by-same-date.ts
export class GetEntriesBySameDateUseCase {
  constructor(private repository: DiaryRepository) {}

  async execute(input: { date: Date; years?: number }): Promise<DiaryEntry[]> {
    const years = input.years ?? 5;

    // DateValueで同じ月日の過去N年分の日付を取得
    const dateValue = DateValue.create(input.date);
    const sameDates = dateValue.getSameDatesInPastYears(years);

    // リポジトリ経由で取得
    const entries = await this.repository.findBySameDate(input.date, years);

    // 新しい順にソート（既にソート済みだが念のため）
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
```

## 6. 自動保存

### 6.1 機能概要

ユーザーの入力を検知し、一定時間後に自動的に保存する機能（下書き保存）。

### 6.2 仕様詳細

#### 入力
- **テキスト入力**: ユーザーがテキストエリアに入力

#### 処理
1. テキスト変更を検知
2. デバウンスタイマーをリセット
3. 1秒間入力がない場合、自動保存を実行
4. 保存中フラグを立てる
5. 保存完了後、フラグを解除

#### 出力
- 自動保存完了のフィードバック（「保存中...」→「自動保存しました」）

#### 制約
- デバウンス時間: 1秒
- 保存失敗時は自動リトライ（3回まで）

### 6.3 ユースケース

#### 正常系

**ケース1: 入力中に自動保存**

```
操作:
  1. テキストエリアに「今日は」と入力
  2. 1秒待機
  3. 自動保存が実行される
  4. さらに「設計書を作成した」と追記
  5. 1秒待機
  6. 再度自動保存が実行される
結果:
  - 各1秒ごとに自動保存される
  - 「自動保存中 ●」が表示される
```

#### 異常系

**ケース2: 保存失敗時の自動リトライ**

```
前提条件: ネットワーク接続が不安定
操作: テキストを入力し、1秒待機
結果:
  - 1回目の保存が失敗
  - 自動的に2秒後にリトライ
  - 3回まで自動リトライ
  - 3回失敗した場合、エラーメッセージ表示
```

### 6.4 実装例

```typescript
// デバウンスフック
function useDebouncedSave(
  saveFunction: (content: string) => Promise<void>,
  delay: number = 1000
) {
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useMemo(
    () =>
      debounce(async (content: string) => {
        setIsSaving(true);
        try {
          await saveFunction(content);
        } catch (error) {
          console.error('Auto-save failed:', error);
          // リトライロジック
        } finally {
          setIsSaving(false);
        }
      }, delay),
    [saveFunction, delay]
  );

  return { debouncedSave, isSaving };
}

// 使用例
function DiaryEditor({ date, initialContent }: DiaryEditorProps) {
  const [content, setContent] = useState(initialContent);

  const { debouncedSave, isSaving } = useDebouncedSave(
    async (newContent) => {
      // MVP版: LocalStorageに直接保存
      const repository = new LocalStorageDiaryRepository();
      const entry = DiaryEntry.create(date, newContent);
      await repository.save(entry);

      // 将来版（Phase 2）: Server Actionsを使用
      // await saveDiaryAction({ date, content: newContent });
    }
  );

  useEffect(() => {
    if (content !== initialContent) {
      debouncedSave(content);
    }
  }, [content]);

  // ...
}
```

## 7. 文字数カウント

### 7.1 機能概要

現在入力されているテキストの文字数をリアルタイムで表示する機能。

### 7.2 仕様詳細

#### 入力
- **テキスト**: テキストエリアの内容

#### 処理
1. テキストの長さを計算
2. 上限（10,000文字）との比較
3. 表示更新

#### 出力
- 現在の文字数 / 上限文字数（例: 123 / 10,000）
- 上限超過時の警告表示

#### 制約
- 上限: 10,000文字

### 7.3 ユースケース

#### 正常系

**ケース1: 文字数が上限内**

```
操作: 「今日は設計書を作成した」（13文字）と入力
結果: 「文字数: 13 / 10,000」と表示
```

#### 異常系

**ケース2: 文字数が上限超過**

```
操作: 10,001文字目を入力しようとする
結果:
  - 入力が制限される
  - 「⚠ 文字数が上限を超えています」と警告表示
```

### 7.4 実装例

```typescript
function CharacterCount({ content, maxLength = 10000 }: CharacterCountProps) {
  const count = content.length;
  const isOverLimit = count > maxLength;

  return (
    <div className={cn('text-sm', isOverLimit && 'text-red-600')}>
      {isOverLimit && <span>⚠ </span>}
      文字数: {count.toLocaleString()} / {maxLength.toLocaleString()}
      {isOverLimit && <span> （上限超過）</span>}
    </div>
  );
}
```

## 8. エラーハンドリング

### 8.1 エラー種別と対応

| エラー種別 | 原因 | ユーザーへの表示 | システム対応 |
|-----------|------|----------------|------------|
| 保存失敗 | ネットワークエラー | 「保存に失敗しました。再度お試しください。」 | 自動リトライ（3回） |
| 文字数超過 | 10,000文字超過 | 「文字数が上限を超えています」 | 入力制限 |
| 未来の日付 | 未来の日付を選択 | 「未来の日付は選択できません」 | 日付選択を無効化 |
| データ取得失敗 | データベースエラー | 「データの読み込みに失敗しました」 | エラーページ表示 |
| 重複作成 | 同じ日の日記が既に存在 | - | 編集モードに自動切り替え |

### 8.2 エラー処理フロー

```
エラー発生
 ↓
エラー種別を判定
 ↓
リトライ可能？
 ├─ Yes → 自動リトライ（最大3回）
 │         ↓
 │        成功？
 │         ├─ Yes → 正常終了
 │         └─ No  → ユーザーに通知
 └─ No  → ユーザーに通知
            ↓
         エラーログ記録
            ↓
         終了
```

### 8.3 実装例

```typescript
// エラーハンドリング付き保存
async function saveDiaryWithErrorHandling(
  entry: DiaryEntry,
  maxRetries: number = 3
): Promise<void> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await repository.save(entry);
      return; // 成功
    } catch (error) {
      retries++;
      console.error(`Save failed (attempt ${retries}):`, error);

      if (retries >= maxRetries) {
        // 最終リトライ失敗
        throw new Error('保存に失敗しました。再度お試しください。');
      }

      // リトライ前に待機（指数バックオフ）
      await sleep(Math.pow(2, retries) * 1000);
    }
  }
}
```

## まとめ

主要な機能の仕様を定義しました:

1. **Dial操作による日付選択**: 直感的な回転操作で日付変更
2. **日記の作成**: 1日1エントリーの新規作成
3. **日記の編集**: 既存日記の内容更新
4. **日記の削除**: 確認付きの削除機能
5. **過去の同じ日の日記表示**: 5年分の同じ月日の日記をリスト表示
6. **自動保存**: デバウンス付き自動保存
7. **文字数カウント**: リアルタイム文字数表示
8. **エラーハンドリング**: 包括的なエラー処理とリトライ機構
