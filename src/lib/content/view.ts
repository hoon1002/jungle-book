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

/** 홈 강좌 지도에 넘기는 레슨 한 줄 */
export type CourseLesson = {
  slug: string;
  order: number;
  title: string;
  goal: string | null;
  available: boolean;
  questionIds: string[];
};

export function toCourseLessons(all: Lesson[]): CourseLesson[] {
  return [...all]
    .sort((a, b) => a.order - b.order)
    .map((l) => ({
      slug: l.slug,
      order: l.order,
      title: l.title,
      goal: l.status === "공개" ? l.meta.goal : (l.goal ?? null),
      available: l.status === "공개",
      questionIds: l.status === "공개" ? l.quiz.map((q) => q.id) : [],
    }));
}

export function parseStep(value: string | null | undefined): LessonStep {
  return value === "quiz" || value === "summary" ? value : "read";
}

/** "검수 전" → "검수 전", "홍길동(다이아)" → "검수: 홍길동(다이아)" */
export function reviewLabel(review: string): string {
  return review.replace(/\s/g, "") === "검수전" ? "검수 전" : `검수: ${review}`;
}

/**
 * 검색(구글·네이버)에 보여도 되는지. 공개 레슨이 모두 예시(isExample)면 숨긴다.
 * 실제 레슨을 하나라도 공개하면 자동으로 검색에 나온다.
 */
export function hasRealLesson(all: Lesson[]): boolean {
  return all.some((l) => l.status === "공개" && !l.meta.isExample);
}
