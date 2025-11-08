'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface SearchResult {
  index: number;
  text: string;
  start: number;
  end: number;
}

interface SimpleSearchProps {
  content: string;
  isVisible: boolean;
  onClose: () => void;
}

export const SimpleSearch: React.FC<SimpleSearchProps> = ({
  content,
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Perform search
  const performSearch = (searchQuery: string) => {
    if (!searchQuery || !content) {
      setResults([]);
      return;
    }

    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    const searchResults: SearchResult[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      searchResults.push({
        index: searchResults.length,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    setResults(searchResults);
    if (searchResults.length > 0) {
      setCurrentIndex(0);
    }
  };

  // Highlight text - safer implementation
  const highlightContent = () => {
    if (!query || results.length === 0) return content;

    try {
      let highlightedText = content;
      let offset = 0;

      // Sort results by start position to avoid issues
      const sortedResults = [...results].sort((a, b) => a.start - b.start);

      sortedResults.forEach((result, resultIndex) => {
        const isCurrent = resultIndex === currentIndex;
        const start = result.start + offset;
        const end = result.end + offset;

        // Safety check for text boundaries
        if (start < 0 || end > highlightedText.length || start > end) return;

        const before = highlightedText.slice(0, start);
        const match = highlightedText.slice(start, end);
        const after = highlightedText.slice(end);

        const highlightClass = isCurrent
          ? 'bg-yellow-300 dark:bg-yellow-600 text-foreground px-1 rounded ring-2 ring-yellow-400 ring-offset-2'
          : 'bg-yellow-200 dark:bg-yellow-700 text-foreground px-1 rounded';

        highlightedText = `${before}<mark class="${highlightClass}">${match}</mark>${after}`;
        offset += `<mark class="${highlightClass}">`.length + `</mark>`.length - match.length;
      });

      return highlightedText;
    } catch (error) {
      console.error('Highlight error:', error);
      return content; // Return original content if highlighting fails
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    performSearch(value);
  };

  // Handle navigation
  const handleNext = () => {
    if (results.length > 0) {
      const nextIndex = (currentIndex + 1) % results.length;
      setCurrentIndex(nextIndex);
      scrollToResult(nextIndex);
    }
  };

  const handlePrev = () => {
    if (results.length > 0) {
      const prevIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      scrollToResult(prevIndex);
    }
  };

  // Scroll to result
  const scrollToResult = (index: number) => {
    setTimeout(() => {
      const highlights = document.querySelectorAll('mark');
      const targetHighlight = highlights[index];
      if (targetHighlight) {
        targetHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Auto-focus when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Update highlights when index changes
  useEffect(() => {
    if (results.length > 0) {
      scrollToResult(currentIndex);
    }
  }, [currentIndex]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Search Bar */}
      <div className="fixed top-4 right-4 z-[9999] bg-background border border-border rounded-lg shadow-lg p-4 w-96">
        <div className="flex items-center space-x-2 mb-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('search.placeholder') || 'Search...'}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted-foreground/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted-foreground/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results Info */}
        {query && (
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {results.length > 0 ? (
                <span>{currentIndex + 1} / {results.length} {t('search.results') || 'results'}</span>
              ) : (
                <span>{t('search.noResults') || 'No results found'}</span>
              )}
            </div>

            {results.length > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrev}
                  className="p-1 rounded hover:bg-muted-foreground/10"
                  title="Previous (↑)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 rounded hover:bg-muted-foreground/10"
                  title="Next (↓)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Keyboard shortcuts */}
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex space-x-4">
            <span>↑↓ Navigate</span>
            <span>Enter Next</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>

      {/* Highlighted Content Overlay - Only show when there are results */}
      {query && results.length > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-[9998]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
        >
          <div
            className="h-full overflow-auto custom-scrollbar p-7 markdown-body"
            dangerouslySetInnerHTML={{ __html: highlightContent() }}
          />
        </div>
      )}
    </>
  );
};