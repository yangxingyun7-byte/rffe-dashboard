/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出（GitHub Pages 部署用）
  output: "export",

  // 部署到子路径
  basePath: "/rffe-dashboard",

  // 图片不优化
  images: {
    unoptimized: true,
  },

  // 构建时忽略 TypeScript 错误
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack 工作目录
  turbopack: {
    root: ".",
  },
}

export default nextConfig
