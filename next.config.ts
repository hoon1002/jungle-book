import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버 없이 HTML/CSS/JS 파일만 만들어 `out/` 폴더에 내보낸다 (어떤 무료 호스팅에도 올릴 수 있음)
  output: "export",
  // 정적 내보내기에서는 Next.js 기본 이미지 최적화 서버를 쓸 수 없다
  images: { unoptimized: true },
  // cacheComponents / partialPrefetching 은 서버가 필요해서 정적 내보내기와 함께 쓸 수 없다
  // ("PPR cannot be enabled in export mode"). 나중에 서버 기능이 필요해지면 그때 다시 검토.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
