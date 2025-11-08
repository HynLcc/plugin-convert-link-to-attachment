'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SafeSearchProps {
  content: string;
  isVisible: boolean;
  onClose: () => void;
}

export const SafeSearch: React.FC<SafeSearchProps> = ({
  content,
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{index: number; start: number; end: number; text: string}>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simple and safe search implementation
  const performSearch = (searchQuery: string) => {
    if (!searchQuery || !content) {
      setResults([]);
      return;
    }

    try {
      // Simple case-insensitive search
      const lowerContent = content.toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();
      const searchResults: Array<{index: number; start: number; end: number; text: string}> = [];
      let searchIndex = 0;

      let searchStart = lowerContent.indexOf(lowerQuery);
      while (searchStart !== -1) {
        searchResults.push({
          index: searchIndex++,
          start: searchStart,
          end: searchStart + searchQuery.length,
          text: content.slice(searchStart, searchStart + searchQuery.length)
        });
        searchStart = lowerContent.indexOf(lowerQuery, searchStart + 1);
      }

      setResults(searchResults);
      if (searchResults.length > 0) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
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
      // Find all text nodes that contain the search query
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            return node.parentElement?.classList.contains('markdown-body') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeValue && node.nodeValue.toLowerCase().includes(query.toLowerCase())) {
          textNodes.push(node);
        }
      }

      // Try to scroll to the appropriate node
      if (textNodes.length > 0 && index < textNodes.length) {
        const targetNode = textNodes[index];
        if (targetNode.parentElement) {
          targetNode.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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

      {/* Simple indicator overlay */}
      {query && results.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-background border border-border rounded-lg shadow-lg px-3 py-2">
          <div className="text-sm text-foreground">
            Found {results.length} matches
          </div>
        </div>
      )}
    </>
  );
};