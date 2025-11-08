import { SearchResult } from './SearchBar';

// Escape special characters for regex
export const escapeRegex = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Perform case-insensitive search in text
export const performSearch = (text: string, query: string): SearchResult[] => {
  if (!query || !text) return [];

  const results: SearchResult[] = [];
  const escapedQuery = escapeRegex(query);
  const regex = new RegExp(escapedQuery, 'gi');
  let match;

  while ((match = regex.exec(text)) !== null) {
    results.push({
      index: results.length,
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return results;
};

// Highlight search results in text
export const highlightText = (
  text: string,
  results: SearchResult[],
  currentIndex: number
): string => {
  if (!results.length) return text;

  let highlightedText = text;
  let offset = 0;

  // Sort results by start position
  const sortedResults = [...results].sort((a, b) => a.start - b.start);

  sortedResults.forEach((result, resultIndex) => {
    const isCurrent = resultIndex === currentIndex;
    const start = result.start + offset;
    const end = result.end + offset;

    const before = highlightedText.slice(0, start);
    const match = highlightedText.slice(start, end);
    const after = highlightedText.slice(end);

    const highlightClass = isCurrent
      ? 'bg-yellow-300 dark:bg-yellow-600 text-foreground px-1 rounded'
      : 'bg-yellow-200 dark:bg-yellow-700 text-foreground px-1 rounded';

    highlightedText = `${before}<mark class="${highlightClass}">${match}</mark>${after}`;
    offset += `<mark class="${highlightClass}">`.length + `</mark>`.length - match.length;
  });

  return highlightedText;
};

// Scroll to highlighted element
export const scrollToHighlight = (index: number) => {
  const highlights = document.querySelectorAll('mark[data-search-index]');
  const targetHighlight = highlights[index];

  if (targetHighlight) {
    targetHighlight.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Remove previous active classes
    highlights.forEach((el) => {
      el.classList.remove('ring-2', 'ring-yellow-400', 'ring-offset-2');
    });

    // Add active class to current highlight
    targetHighlight.classList.add('ring-2', 'ring-yellow-400', 'ring-offset-2');
  }
};

// Add data attributes to highlights for navigation
export const addHighlightAttributes = (container: HTMLElement) => {
  const highlights = container.querySelectorAll('mark');
  highlights.forEach((highlight, index) => {
    highlight.setAttribute('data-search-index', index.toString());
  });
};