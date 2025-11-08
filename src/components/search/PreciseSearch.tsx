'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  index: number;
  text: string;
  start: number;
  end: number;
  elements: HTMLElement[];
  ranges: Range[];
}

interface PreciseSearchProps {
  content: string;
  isVisible: boolean;
  onClose: () => void;
}

export const PreciseSearch: React.FC<PreciseSearchProps> = ({
  content,
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightedElements, setHighlightedElements] = useState<HTMLElement[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all highlights
  const clearHighlights = useRef(() => {
    const currentElements = document.querySelectorAll('.search-highlight');
    currentElements.forEach(element => {
      if (element && element.parentNode) {
        const parent = element.parentNode;
        parent.replaceChild(
          document.createTextNode(element.textContent || ''),
          element
        );
        parent.normalize();
      }
    });
  }).current;

  // Validate text node and match
  const validateTextNodeAndMatch = (textNode: Text, match: RegExpMatchArray): boolean => {
    const nodeText = textNode.textContent || '';

    // Check if node is still valid and connected to DOM
    if (!textNode.isConnected || !textNode.parentNode) {
      console.warn('Text node is no longer connected to DOM');
      return false;
    }

    // Check if node text is empty
    if (!nodeText || nodeText.length === 0) {
      console.warn('Text node is empty');
      return false;
    }

    // Check if match index is valid
    if (match.index === undefined || match.index < 0) {
      console.warn('Invalid match index:', match.index);
      return false;
    }

    // Check if match is within node bounds
    if (match.index > nodeText.length) {
      console.warn(`Match index ${match.index} exceeds node length ${nodeText.length}`);
      return false;
    }

    // Check if match end is within node bounds
    const matchEnd = match.index + match[0].length;
    if (matchEnd > nodeText.length) {
      console.warn(`Match end ${matchEnd} exceeds node length ${nodeText.length}`);
      return false;
    }

    return true;
  };

  // Safe range creation with validation
  const createSafeRange = (textNode: Text, match: RegExpMatchArray): Range | null => {
    if (!validateTextNodeAndMatch(textNode, match)) {
      return null;
    }

    try {
      const range = document.createRange();
      const nodeText = textNode.textContent || '';

      // Double-check before setting range
      if (match.index <= nodeText.length && match.index + match[0].length <= nodeText.length) {
        range.setStart(textNode, match.index);
        range.setEnd(textNode, match.index + match[0].length);
        return range;
      } else {
        console.warn('Range bounds validation failed');
        return null;
      }
    } catch (error) {
      console.warn('Range creation failed:', error);
      return null;
    }
  };

  // Find and highlight text in the DOM
  const findAndHighlightText = (searchQuery: string) => {
    clearHighlights();

    if (!searchQuery || !content) {
      setResults([]);
      return;
    }

    const markdownBody = document.querySelector('.markdown-body');
    if (!markdownBody) return;

    try {
      // Create a TreeWalker to find all text nodes
      const walker = document.createTreeWalker(
        markdownBody,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;

            const tagName = parent.tagName.toLowerCase();

            // Skip certain elements
            if (tagName === 'script' || tagName === 'style' || tagName === 'mark') {
              return NodeFilter.FILTER_REJECT;
            }

            // Skip list item markers and structure elements that would break list formatting
            if (parent.classList && (
              parent.classList.contains('list-item-prefix') ||
              parent.classList.contains('list-item-marker') ||
              parent.classList.contains('list-number') ||
              parent.classList.contains('checkbox-container')
            )) {
              return NodeFilter.FILTER_REJECT;
            }

            // Skip pseudo-elements and generated content
            const parentTagName = parent.parentElement?.tagName.toLowerCase();
            if (parentTagName === 'li' && parent.classList.contains('list-item-prefix')) {
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const searchResults: SearchResult[] = [];
      const newHighlightedElements: HTMLElement[] = [];
      let resultIndex = 0;

      // Simple approach: process each text node individually
      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.trim()) {
          textNodes.push(node as Text);
        }
      }

      // Search in each text node
      textNodes.forEach((textNode) => {
        // Additional node validation before processing
        if (!textNode.isConnected || !textNode.parentNode) {
          return; // Skip disconnected nodes
        }

        const nodeText = textNode.textContent || '';

        // Skip empty nodes
        if (!nodeText || nodeText.length === 0) {
          return;
        }

        const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;

        while ((match = regex.exec(nodeText)) !== null) {
          try {
            // Comprehensive validation before creating Range
            if (match.index !== undefined &&
                match.index >= 0 &&
                match.index + match[0].length <= nodeText.length &&
                nodeText.length > 0) {

              // Double-check node is still valid
              if (!textNode.isConnected || !textNode.parentNode) {
                break; // Exit if node is no longer valid
              }

              // Re-check text content hasn't changed
              const currentText = textNode.textContent || '';
              if (currentText.length !== nodeText.length) {
                break; // Exit if text has changed
              }

              const range = document.createRange();
              range.setStart(textNode, match.index);
              range.setEnd(textNode, match.index + match[0].length);

              const highlight = document.createElement('mark');
              highlight.className = 'search-highlight';
              highlight.style.cssText = `
                background-color: #fef08a !important;
                color: #000 !important;
                padding: 1px 2px !important;
                border-radius: 2px !important;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
                position: relative !important;
                z-index: 1 !important;
              `;

              range.surroundContents(highlight);
              newHighlightedElements.push(highlight);

              searchResults.push({
                index: resultIndex++,
                text: match[0],
                start: match.index,
                end: match.index + match[0].length,
                elements: [highlight],
                ranges: [range]
              });
            }
          } catch (error) {
            // Ignore errors for overlapping ranges or invalid ranges
            console.warn('Range highlighting error:', error);
            // Break the loop on serious errors to avoid infinite loops
            if (error instanceof DOMException && error.name === 'IndexSizeError') {
              break;
            }
          }
        }
      });

      setHighlightedElements(newHighlightedElements);
      setResults(searchResults);
      if (searchResults.length > 0) {
        setCurrentIndex(0);
        updateCurrentHighlight(0);
        scrollToResult(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  };

  // Update the current highlight styling
  const updateCurrentHighlight = (index: number) => {
    highlightedElements.forEach((element, elementIndex) => {
      if (element && element.style) {
        const isCurrent = elementIndex === index;
        if (isCurrent) {
          element.style.backgroundColor = '#facc15';
          element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          element.style.border = '2px solid #eab308';
        } else {
          element.style.backgroundColor = '#fef08a';
          element.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
          element.style.border = 'none';
        }
      }
    });
  };

  // Scroll to result
  const scrollToResult = (index: number) => {
    setTimeout(() => {
      if (highlightedElements[index]) {
        const element = highlightedElements[index];
        if (element) {
          // Find the scrollable container
          const scrollContainer = document.querySelector('.markdown-body')?.parentElement;
          if (scrollContainer) {
            // Get element position relative to container
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            // Calculate scroll position
            const targetScrollTop = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - (scrollContainer.clientHeight / 2) + (elementRect.height / 2);

            scrollContainer.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            });
          } else {
            // Fallback to standard scrollIntoView
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }
        }
      }
    }, 200); // Increased delay to ensure DOM is ready
  };

  // Handle search input with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 200); // 200ms debounce delay
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

  // Debounced search effect
  useEffect(() => {
    if (debouncedQuery) {
      findAndHighlightText(debouncedQuery);
    } else {
      clearHighlights();
      setResults([]);
    }
  }, [debouncedQuery]);

  // Clear highlights when search is closed
  useEffect(() => {
    if (!isVisible) {
      clearHighlights();
      setQuery('');
      setDebouncedQuery('');
      setResults([]);
    }
  }, [isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHighlights();
      // Clean up debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Search Bar */}
      <div ref={searchContainerRef} className="fixed top-4 right-4 z-[9999] bg-background border border-border rounded-lg shadow-lg p-4 w-96">
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
                  setDebouncedQuery('');
                  clearHighlights();
                  setResults([]);
                  if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                  }
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
                  className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
                  title="Previous (↑)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
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

        </div>

      {/* Results indicator */}
      {query && results.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-background border border-border rounded-lg shadow-lg px-3 py-2">
          <div className="text-sm text-foreground">
            {t('search.found', { count: results.length })}
          </div>
        </div>
      )}
    </>
  );
};