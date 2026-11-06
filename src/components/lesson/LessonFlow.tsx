"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { parseStep, type LessonViewData } from "@/lib/content/view";
import { LessonView } from "./LessonView";

/**
 * 주소의 ?step= 값으로 단계를 고른다 (뒤로 가기가 자연스럽게 동작하도록).
 * 정적 사이트에서는 주소 뒤 ?step= 를 페이지가 열린 뒤에야 알 수 있어서,
 * 페이지에서 <Suspense fallback={읽기 단계}> 로 감싸 처음 HTML에 읽기 화면이 바로 들어가게 한다.
 */
export function LessonFlow({ lesson }: { lesson: LessonViewData }) {
  const step = parseStep(useSearchParams().get("step"));

  // 단계가 바뀌면 화면 맨 위부터 보이게 (처음 열 때는 그대로)
  const previous = useRef(step);
  useEffect(() => {
    if (previous.current !== step) window.scrollTo({ top: 0 });
    previous.current = step;
  }, [step]);

  return <LessonView lesson={lesson} step={step} />;
}
