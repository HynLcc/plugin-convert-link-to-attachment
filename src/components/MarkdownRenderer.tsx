import { useState, useEffect } from "react";
import { usePluginBridge } from "@teable/sdk";
import { Spin } from "@teable/ui-lib";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { markdownComponents } from "./markdown/CustomComponents";
import { PreciseSearch } from "./search/PreciseSearch";

const validateSelection = (selection: any) => {
  if (!selection || selection.type !== 'Cells') return 'invalidType';
  if (!selection.range || selection.range.length !== 2) return 'multipleCells';
  const [[startCol, startRow], [endCol, endRow]] = selection.range;
  return (startCol === endCol && startRow === endRow) ? null : 'multipleCells';
};

const extractCellValue = (record: any, fields: any[]) => {
  for (const field of fields) {
    const value = record.fields[field.id];
    if (value !== null && value !== undefined) {
      return typeof value === 'string' ? value : (value?.text || String(value || ''));
    }
  }
  return '';
};

export const MarkdownRenderer = ({ tableId }: { tableId: string }) => {
  const { t } = useTranslation();
  const bridge = usePluginBridge();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRenderedContent, setHasRenderedContent] = useState(false);

  // Search state
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    if (!bridge) return;

    const handleSelection = async (selection: any) => {
      const validationError = validateSelection(selection);

      // 如果选择无效，只有在没有已渲染内容时才显示错误
      if (validationError) {
        if (!hasRenderedContent) {
          setError(t(`selection.error.${validationError}`));
          setIsLoading(false);
        }
        return;
      }

      // 只有在选择新单元格时才加载内容
      setIsLoading(true);
      setError("");

      try {
        const result = await bridge.getSelectionRecords(selection);
        if (result?.records?.[0]) {
          const cellValue = extractCellValue(result.records[0], result.fields || []);
          setContent(cellValue || t('selection.empty'));
          setHasRenderedContent(true);
        } else {
          setError(t('selection.error.noRecords'));
        }
      } catch (err) {
        setError(t('selection.error.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    bridge.on('syncSelection', handleSelection);
    return () => bridge.removeListener('syncSelection', handleSelection);
  }, [bridge, t, hasRenderedContent]);

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchVisible(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && isSearchVisible) {
        setIsSearchVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchVisible]);

  return (
    <>
      {/* Precise Search Component */}
      <PreciseSearch
        content={content}
        isVisible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
      />

      {/* Main Content */}
      <div className="h-full flex flex-col overflow-auto custom-scrollbar">
        {/* Search Toggle Button */}
        {(content || hasRenderedContent) && (
          <div className="flex justify-end p-2 border-b border-border">
            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
              title="Ctrl+F to search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{t('search.placeholder') || 'Search'}</span>
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spin />
          </div>
        ) : error && !hasRenderedContent ? (
          <div className="text-destructive py-4 px-4 text-center">
            <p>{error}</p>
            <p className="text-sm text-foreground/70 mt-2">
              {t('selection.hint')}
            </p>
          </div>
        ) : !content && !hasRenderedContent ? (
          <div className="text-foreground py-8 px-4 text-center">
            <p>{t('selection.empty')}</p>
            <p className="text-sm mt-2">{t('selection.hint')}</p>
            <div className="p-4 border border-dashed border-border rounded-lg mt-4">
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {t('demo.content')}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : content ? (
          <div className="markdown-body p-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>
    </>
  );
};