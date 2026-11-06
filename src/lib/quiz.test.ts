import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "./content/schema";
import { choiceLetter, gradeAnswer, scoreAnswers } from "./quiz";

const question = (id: string, correct: boolean[], condition?: string): QuizQuestion => ({
  id,
  time: "1:25",
  known: ["아는 것"],
  unknown: ["모르는 것"],
  question: "무엇을 할까?",
  choices: correct.map((c, i) => ({ text: `선택 ${i}`, correct: c, why: `이유 ${i}` })),
  condition,
});

describe("gradeAnswer", () => {
  it("정답 하나인 문제", () => {
    const q = question("q1", [false, true, false]);
    expect(gradeAnswer(q, 1)).toEqual({ correct: true, correctIndices: [1], conditional: false });
    expect(gradeAnswer(q, 0)).toEqual({ correct: false, correctIndices: [1], conditional: false });
  });

  it("조건에 따라 정답이 여러 개인 문제는 어느 정답을 골라도 맞다", () => {
    const q = question("q1", [true, true, false], "조건");
    expect(gradeAnswer(q, 0).correct).toBe(true);
    expect(gradeAnswer(q, 1).correct).toBe(true);
    expect(gradeAnswer(q, 2)).toEqual({ correct: false, correctIndices: [0, 1], conditional: true });
  });
});

describe("scoreAnswers", () => {
  const quiz = [question("q1", [true, false, false]), question("q2", [false, true, false])];

  it("푼 문제와 맞은 문제를 센다", () => {
    expect(scoreAnswers(quiz, { q1: 0 })).toEqual({ answered: 1, correct: 1, total: 2, finished: false });
    expect(scoreAnswers(quiz, { q1: 0, q2: 0 })).toEqual({ answered: 2, correct: 1, total: 2, finished: true });
  });

  it("레슨에 없는 문제 id의 답은 세지 않는다 (문제를 지운 경우)", () => {
    expect(scoreAnswers(quiz, { q9: 0 }).answered).toBe(0);
  });
});

it("선택지 글자", () => {
  expect([0, 1, 2, 3].map(choiceLetter)).toEqual(["A", "B", "C", "D"]);
});
