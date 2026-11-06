import type { LessonViewData } from "@/lib/content/view";
import { ButtonLink } from "@/components/ui/ButtonLink";

/** 임시 화면: 3단계에서 실제 상황 퀴즈로 바뀐다 */
export function QuizStepPlaceholder({ lesson }: { lesson: LessonViewData }) {
  return (
    <article>
      <h1 className="font-display text-title font-bold tracking-tight">상황 퀴즈</h1>
      <p className="mt-5 text-lichen">
        퀴즈 화면은 다음 단계에서 만들어요. 이 레슨에는 문제 {lesson.quiz.length}개가 준비돼 있어요.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/lessons/${lesson.slug}?step=summary`}>정리 보기</ButtonLink>
        <ButtonLink variant="secondary" href={`/lessons/${lesson.slug}`}>
          레슨 다시 읽기
        </ButtonLink>
      </div>
    </article>
  );
}
