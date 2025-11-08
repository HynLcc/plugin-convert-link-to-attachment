# Teable Markdown Renderer Plugin

A powerful [Next.js](https://nextjs.org) and [Teable](https://teable.io) plugin that renders Markdown content from table cells with enhanced features and custom styling.

## ✨ Features

- 📝 **Markdown Rendering** - Renders Markdown content from selected table cells
- 🎨 **Enhanced Styling** - Custom styling with GitHub-flavored Markdown support
- 🌈 **Theme Support** - Full light/dark mode compatibility with automatic theme detection
- 🌍 **Internationalization** - Complete i18n support (English/Chinese)
- 📋 **GitHub-Flavored Markdown** - Support for tables, code blocks, and extended syntax
- 🎯 **Code Highlighting** - Syntax highlighting
- 📱 **Responsive Design** - Optimized for all screen sizes
- 🎭 **Custom Components** - Enhanced callouts, tables, and blockquotes
- ⚡ **Performance Optimized** - Built with React Query for efficient data fetching

## 🛠️ Tech Stack

### Core Framework
- **Next.js 14.2.14** - React full-stack framework with App Router
- **React 18.2.0** - UI library with modern React features
- **TypeScript 5** - Type-safe JavaScript superset

### Teable Ecosystem
- `@teable/sdk` - Plugin bridge and UI configuration
- `@teable/openapi` - API client and type definitions
- `@teable/core` - Core type definitions and utilities
- `@teable/ui-lib` - Teable official UI component library
- `@teable/next-themes` - Theme switching support

### Markdown & Styling
- `react-markdown` - Markdown rendering with React components
- `remark-gfm` - GitHub-flavored Markdown support
- `shiki` - Syntax highlighting engine
- `github-markdown-css` - GitHub-style Markdown CSS
- `tailwindcss` - Atomic CSS framework
- `@tailwindcss/typography` - Typography utilities

### State Management & Data
- `@tanstack/react-query` - Server state management and caching
- `react-i18next` - Internationalization framework
- `i18next` - Core internationalization library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Teable account with API access

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev -p 3000
```
Visit [http://localhost:3000](http://localhost:3000) to view the plugin.

### 3. Build for Production
```bash
npm run build
```

### 4. Start Production Server
```bash
npm start
```

### 5. Optimize Assets (Optional)
```bash
npm run optimize
npm run build:optimized
```

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Main app entry with i18n and theme setup
│   ├── Main.tsx                 # Theme and QueryClient integration
│   ├── layout.tsx               # Root layout component
│   └── globals.css              # Global styles and CSS variables
├── components/
│   ├── MarkdownRenderer.tsx     # Main Markdown rendering component
│   ├── MarkdownPages.tsx        # Page wrapper component
│   ├── context/                 # React Context providers
│   │   ├── EnvProvider.tsx      # Environment variable injection
│   │   ├── I18nProvider.tsx     # Internationalization provider
│   │   └── types.ts             # TypeScript type definitions
│   ├── markdown/                # Custom Markdown components
│   │   ├── CustomComponents.tsx # Enhanced Markdown component mappings
│   │   ├── CodeBlock.tsx        # Syntax-highlighted code blocks
│   │   ├── Callout.tsx          # Custom callout components
│   │   └── TableOfContents.tsx  # TOC generation
│   └── ui/                      # UI utility components
│       └── Icons.tsx            # Custom icon components
├── hooks/                       # Custom React hooks
│   ├── useInitApi.ts           # API initialization
│   └── useViewId.ts            # View ID management
├── styles/                      # Styling
│   ├── markdown.css            # Markdown-specific styles
│   └── custom-enhancements.css  # Custom component styles
├── locales/                     # Internationalization files
│   ├── en.json                 # English translations
│   └── zh.json                 # Chinese translations
└── scripts/                     # Build and optimization scripts
    └── optimize-assets.js      # Asset optimization
```

## 🔧 Configuration

### Plugin Parameters
The plugin reads configuration from URL parameters via `EnvProvider.tsx`:

- `baseId` - Teable base identifier
- `pluginId` - Plugin identifier
- `pluginInstallId` - Plugin installation ID
- `tableId` - Target table for Markdown content
- `shareId`, `positionId`, `positionType` - UI positioning
- `lang`, `theme` - Localization and theme settings

### Environment Setup
The plugin automatically:
- Reads Teable configuration from URL parameters
- Sets up theme detection and switching
- Initializes internationalization with proper language detection
- Configures API clients with authentication

## 🎨 Styling & Theming

### CSS Architecture
- **CSS Variables** - Comprehensive theme system with HSL color values
- **Responsive Design** - Mobile-first approach with breakpoints
- **Component Isolation** - Scoped styles for custom components
- **Dark Mode Support** - Automatic theme detection and switching

### Custom Components
- **Callouts** - Color-coded information boxes with hover effects
- **Code Blocks** - Syntax highlighting with copy buttons and line numbers
- **Tables** - Enhanced styling with hover states and responsive design
- **Blockquotes** - Custom styling with decorative elements

## 🌍 Internationalization

Supported languages:
- English (en)
- Chinese (zh)

### Adding New Languages
1. Create translation file in `src/locales/[lang].json`
2. Update `I18nProvider.tsx` resources configuration
3. Add language-specific content to components

## 🔌 Teable Integration

### Plugin Bridge Usage
```typescript
import { usePluginBridge } from '@teable/sdk';

const bridge = usePluginBridge();

// Listen for selection changes
bridge.on('syncSelection', handleSelection);

// Get selected cell content
const result = await bridge.getSelectionRecords(selection);
```

### API Integration
The plugin uses Teable's OpenAPI with automatic authentication:
```typescript
import { openApi } from '@teable/openapi';

// All API calls are automatically authenticated
const data = await openApi.getTableRecords(tableId, viewId);
```

## 🚀 Deployment

### Build Optimization
```bash
# Analyze bundle size
npm run analyze

# Build with asset optimization
npm run build:optimized
```

### Plugin Installation
1. Build the plugin: `npm run build`
2. Deploy to your hosting service
3. Configure in Teable with proper URL parameters
4. Test plugin functionality in Teable environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.