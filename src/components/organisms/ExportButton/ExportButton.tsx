'use client';

import { useState } from 'react';
import type { ExportFormat } from '@/app/actions/export';
import { exportDiaryEntries } from '@/app/actions/export';
import { cn } from '@/lib/utils/cn';

type ExportButtonProps = {
  className?: string;
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const ExportButton = ({ className }: ExportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setIsOpen(false);
    setExportError(null);

    try {
      const result = await exportDiaryEntries(format);

      if (!result.success) {
        setExportError(result.error.message);
        return;
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

      if (format === 'json') {
        downloadFile(result.data, `dialy-export-${dateStr}.json`, 'application/json');
      } else {
        downloadFile(result.data, `dialy-export-${dateStr}.md`, 'text/markdown');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {exportError && (
        <div
          role="alert"
          className={cn(
            'absolute right-0 top-full z-10 mt-1 w-56 rounded-md border border-red-300',
            'bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md',
          )}
        >
          {exportError}
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isExporting}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="日記をエクスポート"
        className={cn(
          'flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5',
          'text-sm text-gray-600 shadow-sm transition-colors',
          'hover:border-gray-300 hover:text-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {isExporting ? 'エクスポート中...' : 'エクスポート'}
      </button>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-gray-200',
            'bg-white py-1 shadow-lg',
          )}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport('json')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            JSON でエクスポート
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport('markdown')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Markdown でエクスポート
          </button>
        </div>
      )}
    </div>
  );
};
