'use server';

import { getCurrentUserId } from '@/lib/auth/get-server-session';
import { getRepository } from '@/lib/infrastructure/server-repository';
import { isAppError } from '@/types/errors';
import type { ActionResult } from './types';

export type ExportFormat = 'json' | 'markdown';

export type ExportedEntry = {
  id: string;
  date: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

/**
 * 全日記エントリーをエクスポート用データとして返す。
 */
export const exportDiaryEntries = async (
  format: ExportFormat = 'json',
): Promise<ActionResult<string>> => {
  try {
    const userId = await getCurrentUserId();
    const repository = await getRepository();
    const entries = await repository.findAll(userId);

    const exportedEntries: ExportedEntry[] = entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      content: e.content,
      tags: [...e.tags],
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    if (format === 'json') {
      const json = JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          entries: exportedEntries,
        },
        null,
        2,
      );
      return { success: true, data: json };
    }

    // Markdown format
    const lines: string[] = [
      '# Dialy エクスポート',
      '',
      `エクスポート日時: ${new Date().toLocaleString('ja-JP')}`,
      '',
      '---',
      '',
    ];

    for (const entry of exportedEntries.sort((a, b) => a.date.localeCompare(b.date))) {
      lines.push(`## ${entry.date}`);
      lines.push('');
      if (entry.tags.length > 0) {
        lines.push(`タグ: ${entry.tags.map((t) => `\`${t}\``).join(', ')}`);
        lines.push('');
      }
      lines.push(entry.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return { success: true, data: lines.join('\n') };
  } catch (error) {
    if (isAppError(error)) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Export failed' },
    };
  }
};
