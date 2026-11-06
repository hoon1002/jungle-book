/**
 * 레슨 진행 바. 정글 동선처럼 단계를 "캠프"로 잇는다.
 * 모양이 단계 종류를 뜻한다: 네모 = 읽기, 동그라미 = 퀴즈 문제, 마름모 = 정리.
 */
type NodeKind = "read" | "quiz" | "summary";
type NodeState = "done" | "current" | "upcoming";

export function RouteProgress({ quizCount, position, label }: {
  quizCount: number;
  /** 0 = 읽기, 1..quizCount = 문제, quizCount + 1 = 정리 */
  position: number;
  label: string;
}) {
  const kinds: NodeKind[] = ["read", ...Array<NodeKind>(quizCount).fill("quiz"), "summary"];
  const lastIndex = kinds.length - 1;
  const percent = lastIndex === 0 ? 0 : (Math.min(position, lastIndex) / lastIndex) * 100;

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* 지나온 길은 밝게 */}
        <div aria-hidden className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-moss" />
        <div aria-hidden className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2">
          <div
            className="h-full rounded-full bg-bone transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
        <ol aria-label="레슨 진행" className="relative flex items-center justify-between">
          {kinds.map((kind, i) => {
            const state: NodeState = i < position ? "done" : i === position ? "current" : "upcoming";
            return (
              <li key={i} aria-current={state === "current" ? "step" : undefined} className="flex size-5 items-center justify-center">
                <span className="sr-only">{`${nodeName(kind, i)}, ${STATE_NAME[state]}`}</span>
                <Node kind={kind} state={state} />
              </li>
            );
          })}
        </ol>
      </div>
      <p aria-hidden className="text-small text-lichen">{label}</p>
    </div>
  );
}

const STATE_NAME: Record<NodeState, string> = { done: "지나옴", current: "지금 단계", upcoming: "남음" };

function nodeName(kind: NodeKind, i: number) {
  return kind === "read" ? "읽기" : kind === "summary" ? "정리" : `문제 ${i}`;
}

const STATE_STYLE: Record<NodeState, string> = {
  done: "border-bone bg-bone",
  current: "border-torch bg-torch shadow-halo",
  upcoming: "border-moss-bright bg-night",
};

function Node({ kind, state }: { kind: NodeKind; state: NodeState }) {
  const shape =
    kind === "read"
      ? "size-3.5 rounded-xs"
      : kind === "summary"
        ? "size-3 rotate-45 rounded-xs"
        : "size-2.5 rounded-full";
  return (
    <span
      aria-hidden
      className={`block border-2 transition-colors duration-300 motion-reduce:transition-none ${shape} ${STATE_STYLE[state]}`}
    />
  );
}
