import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';

// Custom Markdown component mapping
export const markdownComponents = {
  // Code block
  pre: ({ children, ...props }: any) => {
    // Check if this is a code block
    const codeElement = children?.props?.children;
    const isCodeBlock = codeElement && typeof codeElement === 'object';

    if (isCodeBlock) {
      const { className, children: codeContent } = codeElement.props || {};
      const language = className?.replace('language-', '');

      return (
        <CodeBlock
          language={language}
          showLineNumbers={true}
          {...props}
        >
          {codeContent}
        </CodeBlock>
      );
    }

    return <pre {...props}>{children}</pre>;
  },

  // Table wrapper
  table: ({ children, ...props }: any) => (
    <div className="notion-table-wrapper notion-scrollbar">
      <table className="notion-table" {...props}>
        {children}
      </table>
    </div>
  ),

  // Blockquote - Check if this is a Callout
  blockquote: ({ children, ...props }: any) => {
  // Check if this is Callout syntax
    const textContent = children?.[0]?.props?.children;
    if (typeof textContent === 'string') {
      const calloutMatch = textContent.match(/^\[!(\w+)\]\s*(.+)$/);
      if (calloutMatch) {
        const [, type, content] = calloutMatch;
        return (
          <Callout type={type.toLowerCase()}>
            {content}
          </Callout>
        );
      }
    }

    return (
      <blockquote className="notion-quote" {...props}>
        {children}
      </blockquote>
    );
  },

  // Task list
  input: ({ type, checked, ...props }: any) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },

  // Image
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      {...props}
    />
  ),

  // Custom link component - open in new tab
  a: ({ href, children, ...props }: any) => {
    // Check if this is an external link
    const isExternal = href && (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//')
    );

    // Check if this is an email link
    const isEmail = href && href.startsWith('mailto:');

    // Check if this is a phone link
    const isPhone = href && href.startsWith('tel:');

    // Set link properties
    const linkProps: any = {
      href,
      ...props,
    };

    // Add security attributes for external links
    if (isExternal) {
      linkProps.target = '_blank';
      linkProps.rel = 'noopener noreferrer';
      linkProps.title = props.title || `Open in new tab: ${href}`;
    }

    // Add special handling for email links
    if (isEmail) {
      linkProps.target = '_blank';
    }

    return (
      <a {...linkProps} className={isExternal ? 'external-link' : ''}>
        {children}
        {isExternal && (
          <span className="external-link-icon" aria-hidden="true">
            ↗
          </span>
        )}
      </a>
    );
  },
};

