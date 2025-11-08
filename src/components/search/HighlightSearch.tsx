'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  index: number;
  text: string;
  start: number;
  end: number;
  element?: HTMLElement;
}

interface HighlightSearchProps {
  content: string;
  isVisible: boolean;
  onClose: () => void;
}

export const HighlightSearch: React.FC<HighlightSearchProps> = ({
  content,
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightsRef = useRef<{ start: number; end: number; element: HTMLElement }[]>([]);

  // Clear all highlights
  const clearHighlights = () => {
    const markdownBody = document.querySelector('.markdown-body');
    if (!markdownBody) return;

    // Remove all highlight marks
    const highlights = markdownBody.querySelectorAll('mark.search-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(
          document.createTextNode(highlight.textContent || ''),
          highlight
        );
        // Normalize the text nodes to merge them
        parent.normalize();
      }
    });

    highlightsRef.current = [];
  };

  // Highlight text in the DOM
  const highlightTextInDOM = (searchQuery: string) => {
    clearHighlights();

    if (!searchQuery || !content) return;

    const markdownBody = document.querySelector('.markdown-body');
    if (!markdownBody) return;

    // Find all text nodes
    const walker = document.createTreeWalker(
      markdownBody,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Exclude script, style, and already highlighted content
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (tagName === 'script' || tagName === 'style' || tagName === 'mark') {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes: { node: Text; parent: HTMLElement }[] = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeValue && node.nodeValue.trim()) {
        textNodes.push({
          node: node as Text,
          parent: node.parentElement as HTMLElement
        });
      }
    }

    // Search and highlight in each text node
    const searchResults: SearchResult[] = [];
    let resultIndex = 0;

    textNodes.forEach(({ node, parent }) => {
      const text = node.nodeValue || '';
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      let match;
      let offset = 0;

      while ((match = regex.exec(text)) !== null) {
        const matchText = match[0];
        const matchStart = match.index;
        const matchEnd = matchStart + matchText.length;

        // Create highlight element
        const highlight = document.createElement('mark');
        highlight.className = 'search-highlight';
        highlight.style.cssText = `
          background-color: #fef08a;
          color: #000;
          padding: 1px 2px;
          border-radius: 2px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        `;

        // Split the text node
        const beforeText = text.substring(offset, matchStart);
        const afterText = text.substring(matchEnd);

        // Create new text nodes
        const beforeNode = document.createTextNode(beforeText);
        const afterNode = document.createTextNode(afterText);

        // Insert the highlight and new text nodes
        parent.insertBefore(beforeNode, node);
        parent.insertBefore(highlight, node);
        highlight.appendChild(document.createTextNode(matchText));
        parent.insertBefore(afterNode, node);

        // Remove the original text node
        parent.removeChild(node);

        // Update the node for next iteration
        node = afterNode;
        offset = 0; // Reset offset since we're working with new nodes

        // Store the highlight reference
        highlightsRef.current.push({
          start: matchStart,
          end: matchEnd,
          element: highlight
        });

        searchResults.push({
          index: resultIndex++,
          text: matchText,
          start: matchStart,
          end: matchEnd,
          element: highlight
        });
      }
    });

    // Mark current result with different style
    if (searchResults.length > 0) {
      setResults(searchResults);
      setCurrentIndex(0);
      updateCurrentHighlight(0);
    }
  };

  // Update the current highlight styling
  const updateCurrentHighlight = (index: number) => {
    // Reset all highlights
    highlightsRef.current.forEach(({ element }) => {
      if (element && element.style) {
        element.style.backgroundColor = '#fef08a';
        element.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
      }
    });

    // Highlight current result
    if (highlightsRef.current[index]) {
      const currentElement = highlightsRef.current[index].element;
      if (currentElement && currentElement.style) {
        currentElement.style.backgroundColor = '#facc15';
        currentElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        currentElement.style.border = '2px solid #eab308';
      }
    }
  };

  // Scroll to current result
  const scrollToResult = (index: number) => {
    setTimeout(() => {
      if (highlightsRef.current[index]) {
        const element = highlightsRef.current[index].element;
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
      }
    }, 100);
  };

  // Handle search input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim()) {
      highlightTextInDOM(value.trim());
    } else {
      clearHighlights();
      setResults([]);
    }
  };

  // Handle navigation
  const handleNext = () => {
    if (results.length > 0) {
      const nextIndex = (currentIndex + 1) % results.length;
      setCurrentIndex(nextIndex);
      updateCurrentHighlight(nextIndex);
      scrollToResult(nextIndex);
    }
  };

  const handlePrev = () => {
    if (results.length > 0) {
      const prevIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      updateCurrentHighlight(prevIndex);
      scrollToResult(prevIndex);
    }
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

  // Clean up highlights when component unmounts or content changes
  useEffect(() => {
    return () => {
      clearHighlights();
    };
  }, [content]);

  // Clear highlights when search is closed
  useEffect(() => {
    if (!isVisible) {
      clearHighlights();
      setQuery('');
      setResults([]);
    }
  }, [isVisible]);

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
                  clearHighlights();
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