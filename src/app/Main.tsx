'use client';
import { getQueryClient } from '@/components/context/get-query-client';
import { MarkdownPages } from '@/components/MarkdownPages';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@teable/next-themes';
import { IUIConfig, usePluginBridge } from '@teable/sdk';
import { useEffect, useState } from 'react';

export default function Main({ theme }: { theme: string }) {
  const pluginBridge = usePluginBridge();
  const queryClient = getQueryClient();
  const [uiConfig, setUIConfig] = useState<IUIConfig | undefined>();
  
  useEffect(() => {
    if (!pluginBridge) {
      return;
    }
    const uiConfigListener = (config: IUIConfig) => {
      setUIConfig(config);
    };
    pluginBridge.on('syncUIConfig', uiConfigListener);
    return () => {
      pluginBridge.removeListener('syncUIConfig', uiConfigListener);
    };
  }, [pluginBridge]);

  return (
    <ThemeProvider attribute="class" forcedTheme={uiConfig?.theme ?? theme}>
      <QueryClientProvider client={queryClient}>
        <MarkdownPages />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
