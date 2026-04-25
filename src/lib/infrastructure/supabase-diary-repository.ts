import type { SupabaseClient } from '@supabase/supabase-js';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { DuplicateDateEntryError, NotFoundError } from '@/types/errors';

type DbDiaryEntry = {
  id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  diary_entry_tags: { name: string }[];
};

/** UTC の 00:00:00.000 に正規化する（タイムゾーン非依存） */
const toStartOfDayUTC = (date: Date): string =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();

/** UTC の 23:59:59.999 に正規化する（タイムゾーン非依存） */
const toEndOfDayUTC = (date: Date): string =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  ).toISOString();

const toDomainEntry = (record: DbDiaryEntry): DiaryEntry =>
  DiaryEntry.reconstruct(
    record.id,
    new Date(record.date),
    record.content,
    new Date(record.created_at),
    new Date(record.updated_at),
    record.diary_entry_tags.map((t) => t.name),
    record.user_id,
  );

export class SupabaseDiaryRepository implements DiaryRepository {
  constructor(private readonly client: SupabaseClient) {}

  async save(entry: DiaryEntry): Promise<void> {
    const dateForDb = toStartOfDayUTC(entry.date);

    // 既存エントリーの確認
    const { data: existing, error: existingError } = await this.client
      .from('diary_entries')
      .select('id')
      .eq('id', entry.id)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (!existing) {
      // 重複日付チェック（同一ユーザー内）
      let duplicateQuery = this.client
        .from('diary_entries')
        .select('id')
        .eq('date', dateForDb)
        .neq('id', entry.id);

      if (entry.userId) {
        duplicateQuery = duplicateQuery.eq('user_id', entry.userId);
      } else {
        duplicateQuery = duplicateQuery.is('user_id', null);
      }

      const { data: duplicate, error: duplicateError } = await duplicateQuery.maybeSingle();

      if (duplicateError) {
        throw new Error(duplicateError.message);
      }

      if (duplicate) {
        throw new DuplicateDateEntryError('An entry for this date already exists');
      }

      // 新規作成
      const { error: insertError } = await this.client.from('diary_entries').insert({
        id: entry.id,
        date: dateForDb,
        content: entry.content,
        created_at: entry.createdAt.toISOString(),
        updated_at: entry.updatedAt.toISOString(),
        user_id: entry.userId ?? null,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new DuplicateDateEntryError('An entry for this date already exists');
        }
        throw new Error(insertError.message);
      }
    } else {
      // 既存エントリーを更新
      const { error: updateError } = await this.client
        .from('diary_entries')
        .update({
          content: entry.content,
          updated_at: entry.updatedAt.toISOString(),
        })
        .eq('id', entry.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 既存タグを削除
      // NOTE: Supabase (PostgREST) はクライアントサイドトランザクションをサポートしないため、
      // コンテンツ更新 → タグ削除 → タグ挿入 の各ステップは非アトミックに実行される。
      const { error: deleteTagsError } = await this.client
        .from('diary_entry_tags')
        .delete()
        .eq('entry_id', entry.id);

      if (deleteTagsError) {
        throw new Error(deleteTagsError.message);
      }
    }

    // タグを挿入（新規・更新共通）
    if (entry.tags.length > 0) {
      const { error: insertTagsError } = await this.client
        .from('diary_entry_tags')
        .insert(entry.tags.map((name) => ({ entry_id: entry.id, name })));

      if (insertTagsError) {
        throw new Error(insertTagsError.message);
      }
    }
  }

  async findById(id: string): Promise<DiaryEntry | null> {
    const { data, error } = await this.client
      .from('diary_entries')
      .select('*, diary_entry_tags(name)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return toDomainEntry(data as DbDiaryEntry);
  }

  async findByDate(date: Date, userId?: string | null): Promise<DiaryEntry | null> {
    const start = toStartOfDayUTC(date);
    const end = toEndOfDayUTC(date);

    let query = this.client
      .from('diary_entries')
      .select('*, diary_entry_tags(name)')
      .gte('date', start)
      .lte('date', end);

    if (userId !== undefined) {
      query = userId === null ? query.is('user_id', null) : query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return toDomainEntry(data as DbDiaryEntry);
  }

  async findBySameDate(date: Date, years = 5, userId?: string | null): Promise<DiaryEntry[]> {
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const currentYear = date.getUTCFullYear();
    const minYear = currentYear - years;

    const targetDates: string[] = [];
    for (let y = currentYear - 1; y >= minYear; y--) {
      targetDates.push(new Date(Date.UTC(y, month, day)).toISOString());
    }

    if (targetDates.length === 0) return [];

    let query = this.client
      .from('diary_entries')
      .select('*, diary_entry_tags(name)')
      .in('date', targetDates)
      .order('date', { ascending: false });

    if (userId !== undefined) {
      query = userId === null ? query.is('user_id', null) : query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    if (!data) return [];
    return (data as DbDiaryEntry[]).map(toDomainEntry);
  }

  async delete(id: string): Promise<void> {
    // 削除して返却された行数で存在チェック
    const { data, error } = await this.client
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      throw new NotFoundError('Diary entry not found');
    }
  }

  async findAll(userId?: string | null): Promise<DiaryEntry[]> {
    let query = this.client
      .from('diary_entries')
      .select('*, diary_entry_tags(name)')
      .order('date', { ascending: false });

    if (userId !== undefined) {
      query = userId === null ? query.is('user_id', null) : query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    if (!data) return [];
    return (data as DbDiaryEntry[]).map(toDomainEntry);
  }

  async search(query: string, userId?: string | null): Promise<DiaryEntry[]> {
    const lower = `%${query.toLowerCase()}%`;

    // タグ名が一致するエントリー ID を取得
    const { data: tagData, error: tagError } = await this.client
      .from('diary_entry_tags')
      .select('entry_id')
      .ilike('name', lower);

    if (tagError) throw new Error(tagError.message);

    const tagMatchIds = ((tagData ?? []) as { entry_id: string }[]).map((r) => r.entry_id);

    // content 一致クエリ（ユーザー入力を .or() 文字列に埋め込まない安全な形式）
    let contentQuery = this.client
      .from('diary_entries')
      .select('*, diary_entry_tags(name)')
      .ilike('content', lower)
      .order('date', { ascending: false });

    if (userId !== undefined) {
      contentQuery =
        userId === null ? contentQuery.is('user_id', null) : contentQuery.eq('user_id', userId);
    }

    const { data: contentData, error: contentError } = await contentQuery;
    if (contentError) throw new Error(contentError.message);

    // タグ一致クエリ（tagMatchIds がある場合のみ実行）
    let tagEntries: DbDiaryEntry[] = [];
    if (tagMatchIds.length > 0) {
      let tagQuery = this.client
        .from('diary_entries')
        .select('*, diary_entry_tags(name)')
        .in('id', tagMatchIds)
        .order('date', { ascending: false });

      if (userId !== undefined) {
        tagQuery = userId === null ? tagQuery.is('user_id', null) : tagQuery.eq('user_id', userId);
      }

      const { data: tagEntryData, error: tagEntryError } = await tagQuery;
      if (tagEntryError) throw new Error(tagEntryError.message);
      tagEntries = (tagEntryData ?? []) as DbDiaryEntry[];
    }

    // マージして重複排除（content 一致を先頭に）
    const seen = new Set<string>();
    const merged: DbDiaryEntry[] = [];
    for (const entry of [...((contentData ?? []) as DbDiaryEntry[]), ...tagEntries]) {
      if (!seen.has(entry.id)) {
        seen.add(entry.id);
        merged.push(entry);
      }
    }

    // 日付降順でソート
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return merged.map(toDomainEntry);
  }
}
