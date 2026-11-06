"use client";

import { useEffect, useRef } from "react";
import { CheckIcon } from "@/components/quiz/icons";
import { Button, ButtonLink } from "@/components/ui/ButtonLink";
import type { LessonViewData } from "@/lib/content/view";
import { reviewLabel } from "@/lib/content/view";
import { josa } from "@/lib/korean";

export function SummaryStep({ lesson, completion, onRetry }: {
  lesson: LessonViewData;
  completion?: CompletionInfo;
  onRetry?: () => void;
}) {
  const { next } = lesson;
  const hasNext = next?.available === true;
  const completed = Boolean(completion?.completedAt);
  const canComplete = Boolean(completion?.ready && completion.quizFinished);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // "완료 표시하기"를 누르면 버튼이 사라지므로, 화면이 바뀐 직후 "완료했어요" 문장으로 초점을 옮긴다
  const justCompleted = useRef(false);
  const completedAt = completion?.completedAt;
  useEffect(() => {
    if (justCompleted.current && completedAt) {
      statusRef.current?.focus();
      justCompleted.current = false;
    }
  }, [completedAt]);

  return (
    <article>
      <h1 className="font-display text-title font-bold tracking-tight sm:text-title-lg">세 줄 요약</h1>
      <p className="mt-3 text-lichen">
        「{lesson.title}」{josa(lesson.title, "을/를")} 정리했어요.
      </p>

      <ul className="mt-8 divide-y divide-moss border-y border-moss">
        {lesson.summary.map((line, i) => (
          <li key={i} className="py-5 text-subheading">
            {line}
          </li>
        ))}
      </ul>

      <section aria-labelledby="evidence-heading" className="mt-14">
        <h2 id="evidence-heading" className="font-display text-heading font-bold">
          출처와 검수
        </h2>
        <p className="mt-2 text-small text-lichen">
          이 레슨은 아래 자료를 바탕으로 썼어요. 믿어도 되는지 직접 확인해 보세요.
        </p>

        <ul className="mt-6 space-y-4">
          {lesson.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-moss-bright underline-offset-4 hover:decoration-bone"
              >
                {s.title}
              </a>
              <p className="text-small text-lichen">{s.checkedAt}에 확인</p>
            </li>
          ))}
        </ul>

        <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md bg-canopy px-4 py-4 text-small">
          <dt className="text-lichen">검증 패치</dt>
          <dd>{lesson.verifiedPatch ?? "패치에 따라 바뀌는 정보 없음"}</dd>
          <dt className="text-lichen">검수</dt>
          <dd>{reviewLabel(lesson.review)}</dd>
        </dl>
      </section>

      <section aria-label="레슨 마치기" className="mt-14 border-t border-moss pt-8">
        {completion && <FinishStatus completion={completion} statusRef={statusRef} />}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!completed && completion && (
            <Button
              aria-disabled={!canComplete || undefined}
              aria-describedby={canComplete ? undefined : "complete-hint"}
              onClick={() => {
                if (!canComplete) return;
                justCompleted.current = true;
                completion.onComplete();
              }}
            >
              완료 표시하기
            </Button>
          )}
          {completed && hasNext && <ButtonLink href={`/lessons/${next.slug}`}>다음 레슨 보기</ButtonLink>}
          <ButtonLink variant={completed && !hasNext ? "primary" : "secondary"} href="/">
            강좌 지도로 돌아가기
          </ButtonLink>
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              {completion?.quizFinished ? "퀴즈 다시 풀기" : "퀴즈 풀기"}
            </Button>
          )}
        </div>

        {!completed && completion?.ready && !canComplete && (
          <p id="complete-hint" className="mt-3 text-small text-lichen">
            퀴즈를 끝까지 풀면 완료할 수 있어요.
          </p>
        )}
        {next && !next.available && (
          <p className="mt-4 text-small text-lichen">
            다음 레슨 「{next.title}」{josa(next.title, "은/는")} 준비 중이에요.
          </p>
        )}
      </section>
    </article>
  );
}

export type CompletionInfo = {
  /** 기기 저장소를 읽었는지 (읽기 전에는 결과를 보여 주지 않는다) */
  ready: boolean;
  firstAttempt: { attempted: number; correct: number; total: number; finished: boolean };
  quizFinished: boolean;
  completedAt: string | null;
  onComplete: () => void;
};

const dateFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" });

function FinishStatus({ completion, statusRef }: {
  completion: CompletionInfo;
  statusRef: React.Ref<HTMLParagraphElement>;
}) {
  if (!completion.ready) return null;
  const { firstAttempt, completedAt } = completion;

  return (
    <div className="space-y-3">
      <p className="text-subheading">
        {firstAttempt.finished
          ? `첫 시도에 ${firstAttempt.total}문제 중 ${firstAttempt.correct}문제를 맞혔어요.`
          : firstAttempt.attempted > 0
            ? `퀴즈 ${firstAttempt.total}문제 중 ${firstAttempt.attempted}문제를 풀었어요. 끝까지 풀면 첫 시도 결과가 나와요.`
            : "아직 퀴즈를 풀지 않았어요."}
      </p>
      {/* 완료하면 화면 읽기 프로그램이 바로 읽어 준다 */}
      <p ref={statusRef} tabIndex={-1} role="status" className="flex items-center gap-2 font-bold empty:hidden">
        {completedAt && (
          <>
            <CheckIcon className="size-5" />
            {dateFormat.format(new Date(completedAt))}에 완료했어요
          </>
        )}
      </p>
    </div>
  );
}
