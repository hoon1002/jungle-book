"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/quiz/icons";
import { buttonClass } from "@/components/ui/ButtonLink";
import type { CourseLesson } from "@/lib/content/view";
import { firstAttemptScore, isCompleted } from "@/lib/progress/store";
import { useProgress } from "@/lib/progress/useProgress";

type NodeState = "done" | "current" | "open" | "locked";

/**
 * 강좌 지도: 레슨을 정글 동선처럼 잇는다. 레슨 화면의 진행 바와 같은 표기를 쓴다.
 * 지나온 길(완료)은 밝게, "여기부터"는 횃불색, 준비 중은 열리지 않는다.
 * 레슨끼리 순서 잠금은 없다 (spec: 각 레슨을 열 수 있다).
 */
export function CourseMap({ lessons }: { lessons: CourseLesson[] }) {
  const { ready, progress } = useProgress();
  // 공개된 레슨 중 아직 끝내지 않은 첫 레슨 = 지금 할 레슨
  const current = lessons.find((l) => l.available && !isCompleted(progress, l.slug));
  const published = lessons.filter((l) => l.available);
  const doneCount = published.filter((l) => isCompleted(progress, l.slug)).length;

  return (
    <section aria-labelledby="course-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="course-heading" className="font-display text-heading font-bold">
          강좌 지도
        </h2>
        {ready && (
          <p className="text-small text-lichen">
            공개된 레슨 {published.length}개 중 {doneCount}개 완료
          </p>
        )}
      </div>

      <ol className="mt-8">
        {lessons.map((lesson, i) => {
          const state: NodeState = !lesson.available
            ? "locked"
            : isCompleted(progress, lesson.slug)
              ? "done"
              : lesson.slug === current?.slug
                ? "current"
                : "open";
          const isLast = i === lessons.length - 1;
          return (
            <li key={lesson.slug} className="relative flex gap-4 pb-10 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute bottom-0 left-5 top-12 w-0.5 -translate-x-1/2 rounded-full ${state === "done" ? "bg-bone" : "bg-moss"}`}
                />
              )}
              <CampNode order={lesson.order} state={state} />
              <div className="min-w-0 flex-1">
                {lesson.available ? (
                  <LessonCard
                    lesson={lesson}
                    state={state}
                    score={ready ? firstAttemptScore(progress, lesson.slug, lesson.questionIds) : null}
                  />
                ) : (
                  <LockedCard lesson={lesson} />
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {ready && published.length > 0 && !current && (
        <p className="mt-10 rounded-md bg-canopy px-4 py-3">
          공개된 레슨을 모두 마쳤어요. 다음 레슨을 준비하고 있어요.
        </p>
      )}
    </section>
  );
}

// 배경색은 상태마다 하나만 준다 (두 개를 같이 주면 CSS 순서에 따라 엉뚱한 색이 이긴다)
const NODE_STYLE: Record<NodeState, string> = {
  done: "border-bone bg-bone text-night",
  current: "border-torch bg-torch text-night shadow-halo",
  open: "border-bone bg-night text-bone",
  locked: "border-moss bg-night text-lichen",
};

function CampNode({ order, state }: { order: number; state: NodeState }) {
  return (
    <span
      aria-hidden
      className={`relative z-0 flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-bold tabular-nums ${NODE_STYLE[state]}`}
    >
      {state === "done" ? <CheckIcon className="size-5" /> : order}
    </span>
  );
}

const STATE_LABEL: Record<NodeState, string> = {
  done: "완료",
  current: "여기부터",
  open: "열림",
  locked: "준비 중",
};

function LessonCard({ lesson, state, score }: {
  lesson: CourseLesson;
  state: NodeState;
  score: ReturnType<typeof firstAttemptScore> | null;
}) {
  return (
    <Link
      href={`/lessons/${lesson.slug}`}
      className="group -mx-3 -mt-1 block rounded-md px-3 py-2 transition-colors hover:bg-canopy motion-reduce:transition-none"
    >
      <p className="flex flex-wrap items-center gap-x-3 text-small">
        <span className="text-lichen">레슨 {lesson.order}</span>
        <span className={state === "current" ? "font-bold text-torch" : state === "done" ? "font-bold" : "text-lichen"}>
          {STATE_LABEL[state]}
        </span>
      </p>
      <h3 className="mt-1 font-display text-subheading font-bold">{lesson.title}</h3>
      {lesson.goal && <p className="mt-1 text-small text-lichen">{lesson.goal}</p>}
      {score?.finished && (
        <p className="mt-2 text-small">
          첫 시도 {score.total}문제 중 {score.correct}문제 정답
        </p>
      )}
      {state === "current" && (
        <span aria-hidden className={`${buttonClass("primary")} mt-4`}>
          {score && score.attempted > 0 ? "이어서 하기" : "시작하기"}
        </span>
      )}
    </Link>
  );
}

function LockedCard({ lesson }: { lesson: CourseLesson }) {
  return (
    <div className="pt-1">
      <p className="flex flex-wrap items-center gap-x-3 text-small text-lichen">
        <span>레슨 {lesson.order}</span>
        <span>준비 중</span>
      </p>
      <h3 className="mt-1 font-display text-subheading font-bold text-lichen">{lesson.title}</h3>
      {lesson.goal && <p className="mt-1 text-small text-lichen">{lesson.goal}</p>}
    </div>
  );
}
