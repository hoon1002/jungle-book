"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/ButtonLink";
import type { QuizQuestion } from "@/lib/content/schema";
import { choiceLetter, gradeAnswer, type Answers, type Grade } from "@/lib/quiz";
import { CheckIcon, ChevronDownIcon, ClockIcon, CrossIcon, EyeIcon, EyeOffIcon } from "./icons";

export type QuizControls = {
  index: number;
  answers: Answers;
  onAnswer: (questionId: string, choiceIndex: number) => void;
  onNext: () => void;
};

/** 상황 퀴즈: 문제를 하나씩 보여 주고, 고르는 즉시 잠그고 정답과 이유를 펼친다 */
export function QuizStep({ quiz, controls }: { quiz: QuizQuestion[]; controls: QuizControls }) {
  const index = Math.min(controls.index, quiz.length - 1);
  const question = quiz[index];

  // 문제가 바뀌면 key 로 새 카드를 바로 그리고, 들어오는 움직임만 준다.
  // (나가는 애니메이션이 끝날 때까지 기다리면, 탭이 뒤에 있을 때 새 문제가 늦게 나타난다)
  return (
    <QuestionCard
      key={question.id}
      question={question}
      chosen={controls.answers[question.id]}
      isLast={index === quiz.length - 1}
      onAnswer={(choice) => controls.onAnswer(question.id, choice)}
      onNext={controls.onNext}
    />
  );
}

function QuestionCard({ question, chosen, isLast, onAnswer, onNext }: {
  question: QuizQuestion;
  chosen: number | undefined;
  isLast: boolean;
  onAnswer: (choice: number) => void;
  onNext: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLElement>(null);
  const grade = chosen === undefined ? null : gradeAnswer(question, chosen);

  // 새 문제가 나오면 맨 위로, 화면 읽기 프로그램이 질문부터 읽게 초점을 옮긴다
  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // 고른 직후(해설이 화면에 그려진 다음) 해설로 스크롤하고 초점을 옮긴다.
  // 이미 풀어 둔 문제로 돌아왔을 때는 움직이지 않는다
  const justAnswered = useRef(false);
  useEffect(() => {
    if (!justAnswered.current || chosen === undefined) return;
    justAnswered.current = false;
    feedbackRef.current?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    feedbackRef.current?.querySelector<HTMLElement>("[data-feedback-heading]")?.focus({ preventScroll: true });
  }, [chosen, reduceMotion]);

  const choose = (i: number) => {
    if (grade) return; // 한 번 고르면 바꿀 수 없다 (첫 판단 연습)
    justAnswered.current = true;
    onAnswer(i);
  };

  return (
    <motion.article
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Situation question={question} />

      <h1 ref={headingRef} tabIndex={-1} className="mt-8 font-display text-heading font-bold">
        {question.question}
      </h1>

      <ul className="mt-5 space-y-3">
        {question.choices.map((choice, i) => (
          <li key={i}>
            <ChoiceButton
              letter={choiceLetter(i)}
              text={choice.text}
              state={choiceState(i, chosen, grade)}
              locked={grade !== null}
              onClick={() => choose(i)}
            />
          </li>
        ))}
      </ul>

      {/* 고르면 여기에 해설이 나타난다. aria-live: 화면 읽기 프로그램이 바로 읽어 준다 */}
      <div aria-live="polite">
        {grade && chosen !== undefined && (
          <Feedback
            ref={feedbackRef}
            question={question}
            chosen={chosen}
            grade={grade}
            isLast={isLast}
            onNext={onNext}
          />
        )}
      </div>
    </motion.article>
  );
}

// ── 상황: 게임 시간, 아는 것, 모르는 것 ──────────────────────

function Situation({ question }: { question: QuizQuestion }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-small text-lichen">
        <ClockIcon />
        게임 시간
        <span className="text-subheading font-bold tabular-nums text-bone">{question.time}</span>
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoPanel title="아는 것" icon={<EyeIcon />} items={question.known} className="bg-canopy" />
        <InfoPanel title="모르는 것" icon={<EyeOffIcon />} items={question.unknown} className="fog-panel" />
      </div>
    </div>
  );
}

function InfoPanel({ title, icon, items, className }: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  className: string;
}) {
  return (
    <section aria-label={title} className={`rounded-md px-4 py-3 ${className}`}>
      <p className="flex items-center gap-1.5 text-small font-bold">
        {icon}
        {title}
      </p>
      {items.length === 1 ? (
        <p className="mt-1.5">{items[0]}</p>
      ) : (
        <ul className="mt-1.5 list-disc space-y-1 pl-5">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── 선택지 ───────────────────────────────────────────────────

type ChoiceState = "idle" | "chosen-correct" | "chosen-wrong" | "correct" | "dimmed";

function choiceState(i: number, chosen: number | undefined, grade: Grade | null): ChoiceState {
  if (!grade) return "idle";
  const isCorrect = grade.correctIndices.includes(i);
  if (i === chosen) return isCorrect ? "chosen-correct" : "chosen-wrong";
  return isCorrect ? "correct" : "dimmed";
}

const CHOICE_STYLE: Record<ChoiceState, string> = {
  idle: "border-moss-bright hover:border-bone hover:bg-canopy",
  "chosen-correct": "border-leaf bg-canopy",
  "chosen-wrong": "border-bone bg-canopy",
  correct: "border-leaf",
  dimmed: "border-moss text-lichen",
};

const STATUS_TEXT: Record<ChoiceState, string | null> = {
  idle: null,
  "chosen-correct": "내 선택, 정답",
  "chosen-wrong": "내 선택, 오답",
  correct: "정답",
  dimmed: null,
};

function ChoiceButton({ letter, text, state, locked, onClick }: {
  letter: string;
  text: string;
  state: ChoiceState;
  locked: boolean;
  onClick: () => void;
}) {
  const isCorrect = state === "chosen-correct" || state === "correct";
  const isChosen = state === "chosen-correct" || state === "chosen-wrong";
  const status = STATUS_TEXT[state];

  return (
    <button
      type="button"
      onClick={onClick}
      // 화면 읽기 프로그램용 이름: "B. 예시 선택지 B, 내 선택, 오답"
      aria-label={`${letter}. ${text}${status ? `, ${status}` : ""}`}
      aria-disabled={locked || undefined}
      className={`flex min-h-14 w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors motion-reduce:transition-none ${CHOICE_STYLE[state]} ${locked ? "cursor-default" : ""}`}
    >
      <span
        aria-hidden
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-small font-bold ${
          isCorrect
            ? "border-leaf bg-leaf text-night"
            : state === "chosen-wrong"
              ? "border-bone bg-bone text-night"
              : "border-moss-bright"
        }`}
      >
        {isCorrect ? <CheckIcon /> : state === "chosen-wrong" ? <CrossIcon /> : letter}
      </span>
      <span className="flex-1">{text}</span>
      {(isChosen || isCorrect) && (
        <span aria-hidden className="mt-0.5 flex shrink-0 flex-col items-end gap-0.5 text-small">
          {isChosen && <span className="text-lichen">내 선택</span>}
          {isCorrect && <span className="font-bold text-leaf">정답</span>}
        </span>
      )}
    </button>
  );
}

// ── 해설 ─────────────────────────────────────────────────────

function Feedback({ ref, question, chosen, grade, isLast, onNext }: {
  ref: React.Ref<HTMLElement>;
  question: QuizQuestion;
  chosen: number;
  grade: Grade;
  isLast: boolean;
  onNext: () => void;
}) {
  const letters = grade.correctIndices.map(choiceLetter).join(", ");
  // 위에서 이미 설명한 선택지(내 선택, 정답)를 뺀 나머지
  const explained = new Set([chosen, ...(grade.correct ? [] : grade.correctIndices)]);
  const others = question.choices.map((c, i) => ({ ...c, i })).filter((c) => !explained.has(c.i));

  return (
    <motion.section
      ref={ref}
      aria-label="해설"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mt-6 scroll-mt-40 rounded-md bg-canopy px-5 py-5"
    >
      <h2 data-feedback-heading tabIndex={-1} className={`font-display text-heading font-bold ${grade.correct ? "text-leaf" : ""}`}>
        {grade.correct ? "맞았어요" : `아쉬워요. 정답은 ${letters}예요`}
      </h2>

      <div className="mt-4 space-y-4">
        {grade.correct ? (
          <p>{question.choices[chosen].why}</p>
        ) : (
          <>
            <Explanation label={`내가 고른 ${choiceLetter(chosen)}`} text={question.choices[chosen].why} />
            {grade.correctIndices.map((i) => (
              <Explanation key={i} label={`정답 ${choiceLetter(i)}`} text={question.choices[i].why} />
            ))}
          </>
        )}

        {question.condition && (
          <div className="border-l-2 border-moss-bright pl-3">
            <p className="text-small font-bold text-lichen">조건에 따라 정답이 달라요</p>
            <p className="mt-1">{question.condition}</p>
          </div>
        )}
      </div>

      {others.length > 0 && <OtherChoices choices={others} />}

      <div className="mt-6">
        <Button onClick={onNext}>{isLast ? "정리 보기" : "다음 문제"}</Button>
      </div>
    </motion.section>
  );
}

function Explanation({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-small font-bold text-lichen">{label}</p>
      <p className="mt-1">{text}</p>
    </div>
  );
}

function OtherChoices({ choices }: { choices: { i: number; why: string; text: string }[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mt-5 border-t border-moss pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-small text-lichen hover:text-bone"
      >
        <ChevronDownIcon className={`size-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        다른 선택지 해설 {open ? "접기" : "보기"}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-1 pt-3">
              {choices.map((c) => (
                <Explanation key={c.i} label={`${choiceLetter(c.i)}. ${c.text}`} text={c.why} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
