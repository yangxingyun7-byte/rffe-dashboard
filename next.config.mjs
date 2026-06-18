/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片不优化（兼容性更好）
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

  // 部署到子路径时设置（GitHub Pages 需要，Vercel 不需要）
  // 如果部署到 Vercel，注释掉下面这行
  // basePath: "/rffe-dashboard",
}

export default nextConfig
