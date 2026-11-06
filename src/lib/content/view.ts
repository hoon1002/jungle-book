/**
 * 레슨 화면에 넘기는 데이터. 빌드 때 만들어져 브라우저로 전달되므로 글자·숫자·목록만 담는다.
 * 브라우저 쪽 컴포넌트는 이 파일에서 `import type` 만 한다.
 */
import type { Lesson, PublishedLesson } from "./load";
import type { QuizQuestion } from "./schema";

export type LessonStep = "read" | "quiz" | "summary";

export type LessonViewData = {
  slug: string;
  order: number;
  title: string;
  goal: string;
  isExample: boolean;
  verifiedPatch: string | null;
  review: string;
  summary: string[];
  sources: { title: string; url: string; checkedAt: string }[];
  html: string;
  quiz: QuizQuestion[];
  /** 순서상 다음 레슨. 준비중이면 available: false */
  next: { slug: string; title: string; order: number; available: boolean } | null;
};

export function toLessonView(lesson: PublishedLesson, all: Lesson[]): LessonViewData {
  const nextLesson = all.filter((l) => l.order > lesson.order).sort((a, b) => a.order - b.order)[0];
  const { meta } = lesson;
  return {
    slug: lesson.slug,
    order: lesson.order,
    title: meta.title,
    goal: meta.goal,
    isExample: meta.isExample ?? false,
    verifiedPatch: meta.verifiedPatch ?? null,
    review: meta.review,
    summary: meta.summary,
    sources: meta.sources,
    html: lesson.html,
    quiz: lesson.quiz,
    next: nextLesson
      ? {
          slug: nextLesson.slug,
          title: nextLesson.title,
          order: nextLesson.order,
          available: nextLesson.status === "공개",
        }
      : null,
  };
}

export function parseStep(value: string | null | undefined): LessonStep {
  return value === "quiz" || value === "summary" ? value : "read";
}

/** "검수 전" → "검수 전", "홍길동(다이아)" → "검수: 홍길동(다이아)" */
export function reviewLabel(review: string): string {
  return review.replace(/\s/g, "") === "검수전" ? "검수 전" : `검수: ${review}`;
}
