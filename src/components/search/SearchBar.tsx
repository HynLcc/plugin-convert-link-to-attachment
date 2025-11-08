'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface SearchResult {
  index: number;
  text: string;
  start: number;
  end: number;
}

export interface SearchBarProps {
  onSearch: (query: string) => SearchResult[];
  onNavigate: (index: number) => void;
  onHighlight: (index: number) => void;
  results: SearchResult[];
  currentIndex: number;
  isVisible: boolean;
  onToggle: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onNavigate,
  onHighlight,
  results,
  currentIndex,
  isVisible,
  onToggle,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle search input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim()) {
      setIsSearching(true);
      const searchResults = onSearch(value.trim());
      setIsSearching(false);

      // Auto-select first result
      if (searchResults.length > 0) {
        onNavigate(0);
        onHighlight(0);
      }
    } else {
      onSearch('');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!query.trim() || results.length === 0) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        const nextIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
        onNavigate(nextIndex);
        onHighlight(nextIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
        onNavigate(prevIndex);
        onHighlight(prevIndex);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const downIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
        onNavigate(downIndex);
        onHighlight(downIndex);
        break;
      case 'Escape':
        e.preventDefault();
        setQuery('');
        onSearch('');
        onToggle();
        break;
    }
  };

  // Handle clear search
  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  // Auto-focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-background border border-border rounded-lg shadow-lg p-3 w-80">
      <div className="flex items-center space-x-2">
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
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted-foreground/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted-foreground/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search results navigation */}
      {query.trim() && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            {isSearching ? (
              t('search.searching') || 'Searching...'
            ) : results.length > 0 ? (
              <span>
                {currentIndex + 1} / {results.length} {t('search.results') || 'results'}
              </span>
            ) : (
              <span>{t('search.noResults') || 'No results found'}</span>
            )}
          </div>

          {results.length > 0 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
                  onNavigate(prevIndex);
                  onHighlight(prevIndex);
                }}
                className="p-1 rounded hover:bg-muted-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={results.length <= 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const nextIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
                  onNavigate(nextIndex);
                  onHighlight(nextIndex);
                }}
                className="p-1 rounded hover:bg-muted-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={results.length <= 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="mt-2 text-xs text-muted-foreground">
        <div>{t('search.shortcuts') || 'Shortcuts:'}</div>
        <div className="flex space-x-4 mt-1">
          <span>↑↓ Navigate</span>
          <span>Enter Next</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};