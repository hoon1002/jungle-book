"use client";

import Link from "next/link";
import type { LessonStep, LessonViewData } from "@/lib/content/view";
import { ReadStep } from "./ReadStep";
import { RouteProgress } from "./RouteProgress";
import { SummaryStep } from "./SummaryStep";
import { QuizStepPlaceholder } from "./QuizStepPlaceholder";

/** 레슨 한 편의 화면. 단계(step)에 따라 읽기 / 퀴즈 / 정리 중 하나를 보여 준다 */
export function LessonView({ lesson, step }: { lesson: LessonViewData; step: LessonStep }) {
  const quizCount = lesson.quiz.length;
  const position = step === "read" ? 0 : step === "quiz" ? 1 : quizCount + 1;
  const label = step === "read" ? "읽기" : step === "quiz" ? `퀴즈 1/${quizCount}` : "정리";

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-moss bg-night/95 backdrop-blur">
        <div className="mx-auto max-w-column space-y-3 px-5 pb-3 pt-2">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-sm px-2 text-small text-lichen hover:text-bone"
            >
              <ChevronLeft />
              강좌 지도
            </Link>
            <p className="text-small text-lichen">레슨 {lesson.order}</p>
          </div>
          <RouteProgress quizCount={quizCount} position={position} label={label} />
        </div>
      </header>

      <main className="mx-auto max-w-column px-5 pb-20 pt-8 sm:pt-12">
        {step === "read" && <ReadStep lesson={lesson} />}
        {step === "quiz" && <QuizStepPlaceholder lesson={lesson} />}
        {step === "summary" && <SummaryStep lesson={lesson} />}
      </main>
    </>
  );
}

function ChevronLeft() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12.5 4.5 7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
