import { useState, memo, useCallback } from 'react';
import { Copy, Check } from '@/components/ui/Icons';
import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
}

const CodeBlockInternal: React.FC<CodeBlockProps> = ({
  children,
  className = '',
  language,
  showLineNumbers = false,
  filename
}) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const [highlightedCode, setHighlightedCode] = useState<string>('');

  // 缓存高亮器实例
  const highlighterRef = useRef<any>(null);

  // 使用 Shiki 进行语法高亮（优化版本）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const highlightCode = async () => {
      if (!codeRef.current || !language) return;

      try {
        // 防抖处理，避免频繁重新高亮
        timeoutId = setTimeout(async () => {
          // 检查当前主题
          const isDark = document.documentElement.classList.contains('dark');
          const theme = isDark ? 'github-dark' : 'github-light';

          const code = codeRef.current?.textContent || '';

          // 如果没有高亮器或需要加载新语言，重新初始化
          if (!highlighterRef.current) {
            const { createHighlighter } = await import('shiki');

            highlighterRef.current = await createHighlighter({
              themes: ['github-light', 'github-dark'],
              langs: [language.toLowerCase()],
            });
          }

          const highlighted = highlighterRef.current.codeToHtml(code, {
            lang: language.toLowerCase(),
            theme,
          });

          setHighlightedCode(highlighted);
        }, 100); // 100ms 防抖

      } catch (error) {
        console.warn('Failed to highlight code:', error);
        // 如果高亮失败，显示原始代码
        setHighlightedCode(codeRef.current?.textContent || '');
      }
    };

    highlightCode();

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [language]);

  const handleCopy = useCallback(async () => {
    if (!codeRef.current) return;

    try {
      const text = codeRef.current.textContent || '';
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, []);

  // 如果没有语言，使用普通的 pre 标签
  if (!language) {
    return (
      <div className="notion-code-block relative group">
        <pre className={clsx(
          'markdown-body',
          className,
          'relative'
        )}>
          {children}
        </pre>
        <button
          onClick={handleCopy}
          className="notion-code-copy"
          aria-label="Copy code"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    );
  }

  return (
    <div className="notion-code-block relative group">
      {/* 语言标识 */}
      {language && (
        <div className="notion-code-language">
          {language}
        </div>
      )}

      {/* 文件名 */}
      {filename && (
        <div className="notion-code-filename">
          {filename}
        </div>
      )}

      {/* 复制按钮 */}
      <button
        onClick={handleCopy}
        className="notion-code-copy"
        aria-label="Copy code"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>

      {/* 代码内容 */}
      <pre
        className={clsx(
          'markdown-body',
          className,
          showLineNumbers && 'notion-code-with-line-numbers',
          'relative'
        )}
      >
        {highlightedCode ? (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            className={clsx('notion-scrollbar', 'shiki')}
          />
        ) : (
          <code
            ref={codeRef}
            className={`language-${language}`}
          >
            {children}
          </code>
        )}

        {/* 行号 */}
        {showLineNumbers && (
          <div className="notion-code-line-numbers">
            {Array.from(
              { length: (codeRef.current?.textContent || '').split('\n').length },
              (_, i) => (
                <div key={i}>{i + 1}</div>
              )
            )}
          </div>
        )}
      </pre>

      </div>
  );
};

// 使用 memo 优化，防止不必要的重新渲染
export const CodeBlock = memo(CodeBlockInternal);