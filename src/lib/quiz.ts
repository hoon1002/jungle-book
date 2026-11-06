/**
 * 상황 퀴즈 채점. 화면과 상관없는 계산만 둔다 (테스트하기 쉽게).
 * 정답이 조건에 따라 여러 개일 수 있다 (quiz.yaml 의 condition).
 */
import type { QuizQuestion } from "./content/schema";

/** 문제 id → 고른 선택지 번호(0부터) */
export type Answers = Record<string, number>;

export type Grade = {
  correct: boolean;
  /** 정답인 선택지 번호들 */
  correctIndices: number[];
  /** 정답이 조건에 따라 여러 개인 문제인지 */
  conditional: boolean;
};

export function gradeAnswer(question: QuizQuestion, choiceIndex: number): Grade {
  const correctIndices = question.choices.flatMap((c, i) => (c.correct ? [i] : []));
  return {
    correct: correctIndices.includes(choiceIndex),
    correctIndices,
    conditional: correctIndices.length > 1,
  };
}

export function scoreAnswers(quiz: QuizQuestion[], answers: Answers) {
  const answered = quiz.filter((q) => answers[q.id] !== undefined);
  const correct = answered.filter((q) => gradeAnswer(q, answers[q.id]).correct).length;
  return { answered: answered.length, correct, total: quiz.length, finished: answered.length === quiz.length };
}

/** 선택지 표시용 글자: 0 → A */
export const choiceLetter = (i: number) => String.fromCharCode(65 + i);
