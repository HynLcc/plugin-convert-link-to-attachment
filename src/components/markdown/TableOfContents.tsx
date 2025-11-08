import { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { List } from '@/components/ui/Icons';
import { clsx } from 'clsx';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  maxDepth?: number;
}

const TableOfContentsInternal: React.FC<TableOfContentsProps> = ({
  content,
  className = '',
  maxDepth = 3
}) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // Use useMemo to cache heading extraction logic
  const extractHeadings = useMemo(() => {
    return (text: string): TocItem[] => {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const items: TocItem[] = [];
      let match;

      while ((match = headingRegex.exec(text)) !== null) {
        const level = match[1].length;
        if (level <= maxDepth) {
          const text = match[2].trim();
          const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');

          items.push({ id, text, level });
        }
      }

      return items;
    };
  }, [maxDepth]);

  useEffect(() => {
    const items = extractHeadings(content);
    setTocItems(items);
  }, [content, extractHeadings]);

  // Use useCallback to optimize scroll handling function
  const handleScroll = useCallback(() => {
    const headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3');
    const scrollPosition = window.scrollY + 100;

    let currentId = '';
    headings.forEach((heading) => {
      const element = heading as HTMLElement;
      if (element.offsetTop <= scrollPosition) {
        currentId = element.id;
      }
    });

    setActiveId(currentId);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize

    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Use useCallback to optimize scroll to heading function
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Navigation bar height
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className={clsx('notion-toc', className)}>
      <div className="notion-toc-title">
        <List size={16} />
        目录
      </div>
      <nav aria-label="Table of contents">
        <ul className="notion-toc-list">
          {tocItems.map((item) => (
            <li
              key={item.id}
              className={clsx(
                'notion-toc-item',
                `notion-toc-level-${item.level}`
              )}
            >
              <a
                href={`#${item.id}`}
                className={clsx(
                  'notion-toc-link',
                  activeId === item.id && 'active'
                )}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHeading(item.id);
                }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

// Use memo optimization to prevent unnecessary re-renders
export const TableOfContents = memo(TableOfContentsInternal);