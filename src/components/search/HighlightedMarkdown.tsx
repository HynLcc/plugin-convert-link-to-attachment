'use client';
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { highlightText, addHighlightAttributes, scrollToHighlight } from './SearchUtils';
import { SearchResult } from './SearchBar';

interface HighlightedMarkdownProps {
  content: string;
  searchQuery: string;
  searchResults: SearchResult[];
  currentIndex: number;
  components?: any;
  className?: string;
}

export const HighlightedMarkdown: React.FC<HighlightedMarkdownProps> = ({
  content,
  searchQuery,
  searchResults,
  currentIndex,
  components,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple function to process and highlight text
  const processTextContent = (text: string): string => {
    if (!searchQuery || !searchResults.length) return text;
    return highlightText(text, searchResults, currentIndex);
  };

  // Custom component to handle highlighting
  const createHighlightedComponent = (OriginalComponent: string) => {
    return ({ children, ...props }: any) => {
      let processedContent = children;

      if (typeof children === 'string') {
        processedContent = processTextContent(children);
      } else if (Array.isArray(children)) {
        processedContent = children.map((child, index) => {
          if (typeof child === 'string') {
            return (
              <span key={index} dangerouslySetInnerHTML={{ __html: processTextContent(child) }} />
            );
          }
          return child;
        });
      }

      return React.createElement(
        OriginalComponent,
        { ...props },
        typeof processedContent === 'string'
          ? React.createElement('span', { dangerouslySetInnerHTML: { __html: processedContent } })
          : processedContent
      );
    };
  };

  // Enhanced components with highlighting
  const enhancedComponents = {
    ...components,
    p: createHighlightedComponent('p'),
    li: createHighlightedComponent('li'),
    td: createHighlightedComponent('td'),
    th: createHighlightedComponent('th'),
    span: createHighlightedComponent('span'),
    blockquote: createHighlightedComponent('blockquote'),
  };

  // Update highlights and scroll to current result
  useEffect(() => {
    if (containerRef.current && searchResults.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        addHighlightAttributes(containerRef.current!);
        scrollToHighlight(currentIndex);
      }, 100);
    }
  }, [searchResults, currentIndex]);

  return (
    <div ref={containerRef} className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={enhancedComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};