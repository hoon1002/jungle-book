import type { Metadata, Viewport } from "next";
import { Hahmlet } from "next/font/google";
// 본문 글꼴 (OFL 라이선스). 페이지에 실제로 나오는 글자가 든 조각만 내려받는다.
// 쓰는 굵기가 보통(400)·굵게(700) 둘뿐이라, 모든 굵기가 든 가변 글꼴 대신 두 굵기만 쓴다 (조각 크기가 약 1/2.5)
import "pretendard/dist/web/static/Pretendard-Regular.css";
import "pretendard/dist/web/static/Pretendard-Bold.css";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { getLessons } from "@/lib/content/load";
import { hasRealLesson } from "@/lib/content/view";
import { SITE } from "@/lib/site";
import "./globals.css";

// 레슨 제목용 한국어 세리프 (OFL). 빌드 때 내려받아 사이트에 함께 담긴다. 제목은 모두 굵게(700)만 쓴다
const hahmlet = Hahmlet({
  subsets: ["latin"],
  weight: "700",
  display: "swap",
  variable: "--font-hahmlet",
});

export async function generateMetadata(): Promise<Metadata> {
  // 공개 레슨이 예시뿐이면 검색(구글·네이버)에 나오지 않게 한다. 실제 레슨을 공개하면 자동으로 풀린다
  const searchable = hasRealLesson(await getLessons());
  return {
    title: { default: SITE.name, template: `%s | ${SITE.name}` },
    description: SITE.description,
    robots: searchable ? undefined : { index: false, follow: false },
    // 아이폰 홈 화면에서 열었을 때: 앱 이름, 상단 상태 막대를 사이트 바탕 위에 겹쳐 그리기
    appleWebApp: { title: SITE.name, statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = {
  themeColor: SITE.backgroundColor,
  colorScheme: "dark",
  // 노치·홈 막대 영역까지 바탕을 채운다. 글자가 가려지지 않게 globals.css 에서 안전 영역만큼 띄운다
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={hahmlet.variable}>
      <body className="flex min-h-dvh flex-col">
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <ServiceWorker />
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-moss">
      <div className="mx-auto max-w-column space-y-2 px-5 py-8 text-small text-lichen">
        <p>정글을 배우며 만드는 교과서입니다. 레슨마다 출처와 확인한 패치를 적어 둡니다.</p>
        {/*
          라이엇 게임즈 "지식재산 이용 정책" 6항이 요구하는 안내문 (한국어 공식 문구 그대로).
          원문: https://www.riotgames.com/ko/legal (2026-11-06 확인, 정책 최종 갱신 2018년 8월)
        */}
        <p>
          정글 교과서는 라이엇 게임즈의{" "}
          <a
            href="https://www.riotgames.com/ko/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-moss-bright underline-offset-4 hover:text-bone"
          >
            “지식재산 이용 정책”
          </a>
          에 따라 라이엇 게임즈 소유의 자산을 이용하여 제작되었습니다. 라이엇 게임즈는 이 프로젝트를 지지하거나
          후원하지 않습니다.
        </p>
      </div>
    </footer>
  );
}
