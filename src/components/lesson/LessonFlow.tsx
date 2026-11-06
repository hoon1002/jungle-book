"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { parseStep, type LessonViewData } from "@/lib/content/view";
import type { Answers } from "@/lib/quiz";
import { LessonView } from "./LessonView";

/**
 * 주소의 ?step= 값으로 단계를 고른다 (뒤로 가기가 자연스럽게 동작하도록).
 * 정적 사이트에서는 주소 뒤 ?step= 를 페이지가 열린 뒤에야 알 수 있어서,
 * 페이지에서 <Suspense fallback={읽기 단계}> 로 감싸 처음 HTML에 읽기 화면이 바로 들어가게 한다.
 *
 * 퀴즈 진행(몇 번 문제인지, 무엇을 골랐는지)은 여기서 들고 있어서 단계를 오가도 유지된다.
 * 몇 번 문제인지는 주소에 넣지 않는다: 뒤로 가기로 이미 푼 문제를 다시 고르는 일을 막기 위해서다.
 */
export function LessonFlow({ lesson }: { lesson: LessonViewData }) {
  const router = useRouter();
  const step = parseStep(useSearchParams().get("step"));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  // 단계가 바뀌면 화면 맨 위부터 보이게 (처음 열 때는 그대로)
  const previous = useRef(step);
  useEffect(() => {
    if (previous.current !== step) window.scrollTo({ top: 0 });
    previous.current = step;
  }, [step]);

  const stepUrl = (s: "quiz" | "summary") => `/lessons/${lesson.slug}?step=${s}`;

  return (
    <LessonView
      lesson={lesson}
      step={step}
      quiz={{
        index,
        answers,
        onAnswer: (id, choice) => setAnswers((a) => (id in a ? a : { ...a, [id]: choice })),
        onNext: () => {
          if (index < lesson.quiz.length - 1) setIndex(index + 1);
          else router.push(stepUrl("summary"));
        },
      }}
      onRetry={() => {
        setAnswers({});
        setIndex(0);
        router.push(stepUrl("quiz"));
      }}
    />
  );
}
