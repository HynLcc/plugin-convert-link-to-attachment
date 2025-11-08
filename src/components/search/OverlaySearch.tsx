'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  index: number;
  text: string;
  start: number;
  end: number;
  rect?: DOMRect;
}

interface OverlaySearchProps {
  content: string;
  isVisible: boolean;
  onClose: () => void;
}

export const OverlaySearch: React.FC<OverlaySearchProps> = ({
  content,
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlayRects, setOverlayRects] = useState<{ x: number; y: number; width: number; height: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find text positions in the content and create overlay highlights
  const findAndHighlightText = (searchQuery: string) => {
    if (!searchQuery || !content) {
      setResults([]);
      setOverlayRects([]);
      return;
    }

    try {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const searchResults: SearchResult[] = [];
      let match;
      let index = 0;

      while ((match = regex.exec(content)) !== null) {
        searchResults.push({
          index: index++,
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
      }

      setResults(searchResults);
      if (searchResults.length > 0) {
        setCurrentIndex(0);
        highlightTextPositions(searchQuery, searchResults);
      } else {
        setOverlayRects([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setOverlayRects([]);
    }
  };

  // Calculate highlight positions using a temporary DOM approach
  const highlightTextPositions = (searchQuery: string, searchResults: SearchResult[]) => {
    const markdownBody = document.querySelector('.markdown-body');
    if (!markdownBody) return;

    // Create a temporary hidden div to measure text positions
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      top: -9999px;
      left: -9999px;
      width: ${markdownBody.clientWidth}px;
      padding: 28px; /* Match markdown-body padding */
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;

    // Copy the text content and styles
    tempDiv.textContent = content;
    document.body.appendChild(tempDiv);

    // Get computed styles
    const computedStyle = window.getComputedStyle(markdownBody);
    tempDiv.style.fontFamily = computedStyle.fontFamily;
    tempDiv.style.fontSize = computedStyle.fontSize;
    tempDiv.style.lineHeight = computedStyle.lineHeight;

    const rects: { x: number; y: number; width: number; height: number }[] = [];
    const text = tempDiv.textContent || '';
    const lines = text.split('\n');

    let currentLine = 0;
    let currentCharInLine = 0;
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
    const charWidth = 8; // Approximate character width

    searchResults.forEach((result) => {
      // Calculate line number and position
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (charCount + line.length >= result.start) {
          currentLine = i;
          currentCharInLine = result.start - charCount;
          break;
        }
        charCount += line.length + 1; // +1 for newline
      }

      const x = 28 + (currentCharInLine * charWidth); // 28px padding
      const y = 28 + (currentLine * lineHeight);
      const width = result.text.length * charWidth;
      const height = lineHeight;

      rects.push({ x, y, width, height });
    });

    // Clean up
    document.body.removeChild(tempDiv);
    setOverlayRects(rects);
  };

  // Handle search input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    findAndHighlightText(value.trim());
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
    const markdownBody = document.querySelector('.markdown-body');
    if (!markdownBody || !overlayRects[index]) return;

    const rect = overlayRects[index];
    const targetY = rect.y - 200; // Scroll to 200px above the result

    markdownBody.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth'
    });
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

  // Clear search when closed
  useEffect(() => {
    if (!isVisible) {
      setQuery('');
      setResults([]);
      setOverlayRects([]);
    }
  }, [isVisible]);

  // Recalculate highlights on window resize
  useEffect(() => {
    const handleResize = () => {
      if (query.trim()) {
        findAndHighlightText(query.trim());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [query, content]);

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
                  setOverlayRects([]);
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

      {/* Overlay Highlights */}
      {query && overlayRects.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[9998]">
          <div className="relative">
            {overlayRects.map((rect, index) => (
              <div
                key={index}
                className={`absolute transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-yellow-400 opacity-50 border-2 border-yellow-500'
                    : 'bg-yellow-300 opacity-40'
                }`}
                style={{
                  left: `${rect.x}px`,
                  top: `${rect.y}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results indicator */}
      {query && results.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-background border border-border rounded-lg shadow-lg px-3 py-2">
          <div className="text-sm text-foreground">
            Found {results.length} match{results.length !== 1 ? 'es' : ''}
          </div>
        </div>
      )}
    </>
  );
};