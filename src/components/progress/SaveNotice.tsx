"use client";

import { useProgress } from "@/lib/progress/useProgress";

/** 기기에 진행도를 저장하지 못했을 때만 보인다. 레슨은 계속 볼 수 있다 (spec "빈 상태와 오류") */
export function SaveNotice({ className = "" }: { className?: string }) {
  const { saveFailed } = useProgress();
  if (!saveFailed) return null;
  return (
    <p role="status" className={`rounded-md border border-moss-bright bg-canopy px-4 py-3 text-small ${className}`}>
      <span className="font-bold">이 기기에 저장되지 않았어요.</span>{" "}
      <span className="text-lichen">
        레슨은 계속 볼 수 있지만, 페이지를 닫으면 진행도가 사라져요. 브라우저 설정에서 사이트 데이터 저장이 막혀 있는지
        확인해 보세요.
      </span>
    </p>
  );
}
