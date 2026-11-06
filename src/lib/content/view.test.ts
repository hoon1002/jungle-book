import { describe, expect, it } from "vitest";
import type { Lesson } from "./load";
import { hasRealLesson } from "./view";

const lesson = (status: "공개" | "준비중", isExample?: boolean) =>
  (status === "공개"
    ? { slug: "01-a", status, order: 1, title: "제목", meta: { isExample }, html: "", quiz: [] }
    : { slug: "02-b", status, order: 2, title: "제목" }) as unknown as Lesson;

describe("hasRealLesson", () => {
  it("공개 레슨이 예시뿐이면 false (검색에서 숨김)", () => {
    expect(hasRealLesson([lesson("공개", true), lesson("준비중")])).toBe(false);
  });
  it("준비중 레슨만 있으면 false", () => {
    expect(hasRealLesson([lesson("준비중")])).toBe(false);
  });
  it("예시가 아닌 공개 레슨이 하나라도 있으면 true", () => {
    expect(hasRealLesson([lesson("공개", true), lesson("공개")])).toBe(true);
  });
});
