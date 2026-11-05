/**
 * 레슨 양식의 "필수 칸" 규칙. 이 파일이 유일한 기준이다.
 * 양식을 바꾸면 content/_template/ 과 이 파일을 함께 고친다.
 */
import { z } from "zod";

// Zod 기본 오류 문구를 한국어로
z.config(z.locales.ko());

const text = z.string().trim().min(1, { error: "비어 있습니다" });

// ── lesson.md 머리말 ─────────────────────────────────────────

export const LESSON_STATUS = ["공개", "준비중"] as const;

const source = z
  .object({
    title: text,
    url: z.url({ error: "https:// 로 시작하는 주소를 적어 주세요" }),
    checkedAt: z.iso.date({ error: "확인한 날짜를 2026-11-05 형식으로 적어 주세요" }),
  })
  .strict();

/** 공개 레슨: 모든 필수 칸이 채워져야 한다 */
export const publishedMetaSchema = z
  .object({
    title: text,
    goal: text,
    order: z.int().positive(),
    status: z.literal("공개"),
    // 따옴표 없이 26.20 이라고 쓰면 YAML이 숫자 26.2 로 읽어 버리므로 글자만 받는다
    verifiedPatch: z
      .string({ error: '검증 패치는 "26.22" 처럼 따옴표로 감싸 주세요' })
      .trim()
      .min(1, { error: "비어 있습니다" })
      .optional(),
    review: text,
    summary: z.array(text).length(3, { error: "요약은 정확히 3줄이어야 합니다" }),
    sources: z.array(source).min(1, { error: "출처가 최소 1개 있어야 합니다" }),
    isExample: z.boolean().optional(),
  })
  .strict();

/** 준비중 레슨: 홈에 잠긴 카드로만 보이므로 제목·순서만 있으면 된다. 나머지는 쓰는 중이어도 됨 */
export const draftMetaSchema = z
  .object({
    title: text,
    order: z.int().positive(),
    status: z.literal("준비중"),
    goal: text.optional(),
  })
  .loose();

export const lessonMetaSchema = z.discriminatedUnion(
  "status",
  [publishedMetaSchema, draftMetaSchema],
  { error: `status는 ${LESSON_STATUS.map((s) => `"${s}"`).join(" 또는 ")} 중 하나여야 합니다` },
);

// ── quiz.yaml ────────────────────────────────────────────────

/** 한 줄로 써도, 여러 줄 목록으로 써도 되게 한다 */
const textOrList = z
  .union([text, z.array(text).min(1)])
  .transform((v) => (Array.isArray(v) ? v : [v]));

const choice = z
  .object({
    text,
    correct: z.boolean({ error: "correct는 true 또는 false 로 적어 주세요" }),
    why: text,
  })
  .strict();

export const quizQuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, { error: "id는 q1 처럼 영어 소문자·숫자로 적어 주세요" }),
    time: z.string().regex(/^\d{1,2}:\d{2}$/, { error: "게임 시간은 1:25 처럼 적어 주세요" }),
    known: textOrList,
    unknown: textOrList,
    question: text,
    choices: z
      .array(choice)
      .min(3, { error: "선택지는 3~4개여야 합니다" })
      .max(4, { error: "선택지는 3~4개여야 합니다" }),
    condition: text.optional(),
  })
  .strict()
  .superRefine((q, ctx) => {
    const correctCount = q.choices.filter((c) => c.correct).length;
    if (correctCount === 0) {
      ctx.addIssue({ code: "custom", path: ["choices"], message: "정답(correct: true)인 선택지가 하나 이상 있어야 합니다" });
    }
    // spec: 정답이 상황마다 달라지는 문제는 조건을 적고, 정답을 하나로 단정하지 않는다
    if (correctCount > 1 && !q.condition) {
      ctx.addIssue({ code: "custom", path: ["condition"], message: "정답이 여러 개면 어떤 조건에서 그런지 condition에 적어 주세요" });
    }
  });

export const quizSchema = z
  .array(quizQuestionSchema, { error: "quiz.yaml은 - 로 시작하는 문제 목록이어야 합니다" })
  .min(1, { error: "문제가 최소 1개 있어야 합니다" })
  .superRefine((qs, ctx) => {
    const seen = new Set<string>();
    qs.forEach((q, i) => {
      if (seen.has(q.id)) {
        ctx.addIssue({ code: "custom", path: [i, "id"], message: `id "${q.id}"가 겹칩니다. 문제마다 다른 id를 주세요` });
      }
      seen.add(q.id);
    });
  });

// ── 타입 ─────────────────────────────────────────────────────

export type PublishedMeta = z.infer<typeof publishedMetaSchema>;
export type DraftMeta = z.infer<typeof draftMetaSchema>;
export type LessonMeta = z.infer<typeof lessonMetaSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Quiz = z.infer<typeof quizSchema>;

// ── 오류 위치를 사람이 읽을 수 있게 ──────────────────────────

const FIELD_LABELS: Record<string, string> = {
  title: "제목",
  goal: "이 레슨을 마치면",
  order: "순서",
  status: "상태",
  verifiedPatch: "검증 패치",
  review: "검수",
  summary: "요약",
  sources: "출처",
  url: "주소",
  checkedAt: "확인일",
  isExample: "예시 여부",
  id: "문제 id",
  time: "게임 시간",
  known: "아는 정보",
  unknown: "모르는 정보",
  question: "질문",
  choices: "선택지",
  text: "문장",
  correct: "정답 여부",
  why: "해설",
  condition: "조건",
};

/** ["sources", 0, "url"] → "출처(sources) › 1번째 › 주소(url)" */
export function describePath(path: readonly PropertyKey[], rootLabel?: string): string {
  const parts = path.map((seg, i) => {
    if (typeof seg === "number") return i === 0 && rootLabel ? `${rootLabel} ${seg + 1}번` : `${seg + 1}번째`;
    const key = String(seg);
    return FIELD_LABELS[key] ? `${FIELD_LABELS[key]}(${key})` : key;
  });
  return parts.join(" › ");
}
