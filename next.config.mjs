/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出配置（部署到 GitHub Pages / Gitee Pages 必须）
  output: "export",

  // 静态导出时图片不优化
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

  // 部署到子路径时设置（如 https://xxx.github.io/repo-name/）
  // 如果部署到根域名可以注释掉
  // basePath: "/rffe-dashboard",
}

export default nextConfig
