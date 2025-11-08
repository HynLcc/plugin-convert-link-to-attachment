import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用压缩
  compress: true,

  // 实验性功能
  experimental: {
    // 移除 lucide-react，已经替换为自定义图标
    optimizePackageImports: ['clsx', '@teable/ui-lib'],
    // 启用 CSS 优化
    optimizeCss: true,
  },

  // 编译选项
  compiler: {
    // 生产环境移除 console.log
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 输出配置
  output: 'standalone',

  // 启用 SWC 压缩
  swcMinify: true,
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);