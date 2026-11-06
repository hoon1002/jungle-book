import type { Metadata, Viewport } from "next";
import { Hahmlet } from "next/font/google";
// 본문 글꼴. 페이지에 실제로 나오는 글자가 든 조각만 내려받는다 (OFL 라이선스)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

// 레슨 제목용 한국어 세리프 (OFL). 빌드 때 내려받아 사이트에 함께 담긴다
const hahmlet = Hahmlet({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-hahmlet",
});

export const metadata: Metadata = {
  title: { default: "정글 교과서", template: "%s | 정글 교과서" },
  description: "정글을 처음 해보는 플레이어를 위한 레슨과 상황 퀴즈",
};

export const viewport: Viewport = {
  themeColor: "#0e2420",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={hahmlet.variable}>
      <body className="flex min-h-dvh flex-col">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-moss">
      {/* TODO(5단계): Riot Games 팬 콘텐츠 정책("Legal Jibber Jabber") 원문과 대조해 문구 확정 */}
      <div className="mx-auto max-w-column space-y-2 px-5 py-8 text-small text-lichen">
        <p>정글을 배우며 만드는 교과서입니다. 레슨마다 출처와 확인한 패치를 적어 둡니다.</p>
        <p>
          정글 교과서는 Riot Games의 보증을 받지 않은 팬 사이트이며, Riot Games 또는 Riot Games 자산의 제작·관리에
          공식적으로 관여하는 누구의 견해나 의견도 반영하지 않습니다. Riot Games와 관련 자산은 Riot Games, Inc.의
          상표 또는 등록 상표입니다.
        </p>
      </div>
    </footer>
  );
}
