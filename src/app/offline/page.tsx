import type { Metadata } from "next";
import { ReloadButton } from "@/components/pwa/ReloadButton";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "인터넷 연결 없음",
  robots: { index: false },
};

/**
 * 인터넷이 끊긴 상태에서, 이 기기에 저장되지 않은 페이지를 열면 서비스 워커(public/sw.js)가 대신 보여 준다.
 * 주소창은 원래 열려던 주소 그대로라서 "다시 시도"는 그 페이지를 다시 연다.
 */
export default function Offline() {
  return (
    <main className="mx-auto max-w-column px-5 py-20">
      <h1 className="font-display text-title font-bold tracking-tight">인터넷에 연결되어 있지 않아요</h1>
      <p className="mt-4 text-lichen">
        이 페이지는 아직 이 기기에 저장되지 않아서 인터넷 없이는 열 수 없어요. 한 번 열어 본 레슨과 강좌 지도는
        인터넷 없이도 열려요.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ReloadButton>다시 시도</ReloadButton>
        <ButtonLink variant="secondary" href="/">
          강좌 지도로 가기
        </ButtonLink>
      </div>
    </main>
  );
}
