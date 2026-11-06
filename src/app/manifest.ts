import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// 정적 내보내기(output: "export")에서는 빌드 때 파일로 만들어 두라고 직접 표시해야 한다
export const dynamic = "force-static";

/**
 * 홈 화면 앱 정보 (빌드 때 /manifest.webmanifest 파일이 된다).
 * 휴대폰에서 "홈 화면에 추가"를 하면 이 이름·아이콘·색으로 앱처럼 열린다.
 * 아이콘은 scripts/make-icons.ts 가 만든다 (npm run icons).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: SITE.backgroundColor,
    theme_color: SITE.backgroundColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
