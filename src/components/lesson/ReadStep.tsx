import type { LessonViewData } from "@/lib/content/view";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function ReadStep({ lesson }: { lesson: LessonViewData }) {
  return (
    <article>
      {lesson.isExample && (
        <p role="note" className="mb-8 rounded-md border border-moss-bright bg-canopy px-4 py-3 text-small">
          화면 확인용 예시 레슨이에요. 실제 게임 정보가 아니에요.
        </p>
      )}

      <h1 className="font-display text-title font-bold tracking-tight sm:text-title-lg">{lesson.title}</h1>
      <p className="mt-5 text-subheading">
        <span className="text-lichen">이 레슨을 마치면 </span>
        {lesson.goal}
      </p>

      {/* 본문은 작성자가 쓴 lesson.md 를 빌드 때 변환한 HTML (직접 쓴 HTML 태그는 걸러짐) */}
      <div className="lesson-prose mt-10" dangerouslySetInnerHTML={{ __html: lesson.html }} />

      <div className="mt-14 border-t border-moss pt-8">
        <ButtonLink href={`/lessons/${lesson.slug}?step=quiz`}>상황 퀴즈 풀기</ButtonLink>
        <p className="mt-3 text-small text-lichen">
          문제 {lesson.quiz.length}개예요. 하나를 고르면 바로 정답과 이유가 나와요.
        </p>
      </div>
    </article>
  );
}
