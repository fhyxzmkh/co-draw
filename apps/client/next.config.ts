// next.config.js

// 1. 引入 withBundleAnalyzer
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

// 你的 Next.js 配置
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 你其他的配置，例如：
  // reactStrictMode: true,
};

// 2. 使用 withBundleAnalyzer 包裹你的配置并导出
module.exports = withBundleAnalyzer(nextConfig);
