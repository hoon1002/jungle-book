import { describe, expect, it } from "vitest";
import { describePath, lessonMetaSchema, quizSchema } from "./schema";

const validMeta = {
  title: "어디서 시작할까?",
  goal: "시작 위치를 고를 수 있다",
  order: 1,
  status: "공개",
  verifiedPatch: "26.22",
  review: "검수 전",
  summary: ["하나", "둘", "셋"],
  sources: [{ title: "패치 노트", url: "https://example.com", checkedAt: "2026-11-05" }],
};

const choice = (correct: boolean) => ({ text: "선택", correct, why: "이유" });
const validQuestion = {
  id: "q1",
  time: "1:25",
  known: "아는 것",
  unknown: ["모르는 것"],
  question: "무엇을 할까?",
  choices: [choice(true), choice(false), choice(false)],
};

function messages(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return result.success ? [] : result.error!.issues.map((i) => `${describePath(i.path, "문제")}: ${i.message}`);
}

describe("lesson.md 머리말", () => {
  it("공개 레슨의 필수 칸이 다 있으면 통과한다", () => {
    expect(lessonMetaSchema.safeParse(validMeta).success).toBe(true);
  });

  it("준비중 레슨은 제목과 순서만 있어도 통과한다", () => {
    expect(lessonMetaSchema.safeParse({ title: "준비 중", order: 2, status: "준비중" }).success).toBe(true);
  });

  it("출처가 없으면 실패한다", () => {
    expect(messages(lessonMetaSchema.safeParse({ ...validMeta, sources: [] }))).toEqual([
      "출처(sources): 출처가 최소 1개 있어야 합니다",
    ]);
  });

  it("요약이 3줄이 아니면 실패한다", () => {
    expect(messages(lessonMetaSchema.safeParse({ ...validMeta, summary: ["하나", "둘"] }))).toEqual([
      "요약(summary): 요약은 정확히 3줄이어야 합니다",
    ]);
  });

  it("검증 패치를 숫자로 쓰면 따옴표를 쓰라고 알려 준다", () => {
    expect(messages(lessonMetaSchema.safeParse({ ...validMeta, verifiedPatch: 26.2 }))[0]).toContain("따옴표");
  });

  it("출처 주소와 확인일 형식을 검사한다", () => {
    const result = lessonMetaSchema.safeParse({
      ...validMeta,
      sources: [{ title: "x", url: "example.com", checkedAt: "2026/11/05" }],
    });
    expect(messages(result)).toEqual([
      "출처(sources) › 1번째 › 주소(url): https:// 로 시작하는 주소를 적어 주세요",
      "출처(sources) › 1번째 › 확인일(checkedAt): 확인한 날짜를 2026-11-05 형식으로 적어 주세요",
    ]);
  });

  it("칸 이름 오타(모르는 칸)를 잡는다", () => {
    const result = lessonMetaSchema.safeParse({ ...validMeta, sourse: [] });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].code).toBe("unrecognized_keys");
  });

  it("상태 값이 틀리면 알려 준다", () => {
    expect(messages(lessonMetaSchema.safeParse({ ...validMeta, status: "공게" }))[0]).toContain('"공개" 또는 "준비중"');
  });
});

describe("quiz.yaml", () => {
  it("올바른 문제는 통과하고, 한 줄 정보도 목록으로 바뀐다", () => {
    const result = quizSchema.safeParse([validQuestion]);
    expect(result.success).toBe(true);
    expect(result.data![0].known).toEqual(["아는 것"]);
  });

  it("정답이 없으면 실패한다", () => {
    const q = { ...validQuestion, choices: [choice(false), choice(false), choice(false)] };
    expect(messages(quizSchema.safeParse([q]))).toEqual([
      "문제 1번 › 선택지(choices): 정답(correct: true)인 선택지가 하나 이상 있어야 합니다",
    ]);
  });

  it("정답이 여러 개인데 조건이 없으면 실패하고, 조건을 적으면 통과한다", () => {
    const q = { ...validQuestion, choices: [choice(true), choice(true), choice(false)] };
    expect(messages(quizSchema.safeParse([q]))[0]).toContain("조건(condition)");
    expect(quizSchema.safeParse([{ ...q, condition: "아군이 강할 때" }]).success).toBe(true);
  });

  it("선택지가 3~4개가 아니면 실패한다", () => {
    const q = { ...validQuestion, choices: [choice(true), choice(false)] };
    expect(messages(quizSchema.safeParse([q]))[0]).toContain("3~4개");
  });

  it("문제 id가 겹치면 실패한다", () => {
    expect(messages(quizSchema.safeParse([validQuestion, validQuestion]))).toEqual([
      '문제 2번 › 문제 id(id): id "q1"가 겹칩니다. 문제마다 다른 id를 주세요',
    ]);
  });

  it("게임 시간 형식을 검사한다", () => {
    expect(messages(quizSchema.safeParse([{ ...validQuestion, time: "1분 25초" }]))[0]).toContain("1:25");
  });
});
