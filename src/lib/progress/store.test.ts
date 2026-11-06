import { describe, expect, it, vi } from "vitest";
import { createProgressStore, firstAttemptScore, isCompleted, parseProgress, STORAGE_KEY } from "./store";

/** 브라우저 localStorage 를 흉내 내는 가짜 저장소 */
function fakeStorage(initial: Record<string, string> = {}, { failWrites = false } = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    storage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (failWrites) throw new DOMException("quota", "QuotaExceededError");
        data.set(k, v);
      },
      removeItem: (k: string) => void data.delete(k),
      clear: () => data.clear(),
      key: () => null,
      length: 0,
    } as Storage,
  };
}

const NOW = "2026-11-06T10:00:00.000Z";

describe("진행도 저장소", () => {
  it("처음에는 빈 진행도로 시작한다", () => {
    const { storage } = fakeStorage();
    const store = createProgressStore(() => storage);
    expect(store.getSnapshot()).toEqual({ ready: true, progress: { version: 1, lessons: {} }, saveFailed: false });
  });

  it("퀴즈는 첫 시도만 기록하고, 다시 풀어도 덮어쓰지 않는다", () => {
    const { storage, data } = fakeStorage();
    const store = createProgressStore(() => storage, () => NOW);
    store.recordFirstAttempt("01-a", "q1", 1, false);
    store.recordFirstAttempt("01-a", "q1", 0, true); // 다시 풀기
    expect(store.getSnapshot().progress.lessons["01-a"].quiz.q1).toEqual({ firstChoice: 1, correct: false, answeredAt: NOW });
    expect(JSON.parse(data.get(STORAGE_KEY)!).lessons["01-a"].quiz.q1.firstChoice).toBe(1);
  });

  it("완료 표시를 저장하고, 새로 열어도 남아 있다", () => {
    const { storage } = fakeStorage();
    createProgressStore(() => storage, () => NOW).markComplete("01-a");
    const reopened = createProgressStore(() => storage);
    expect(isCompleted(reopened.getSnapshot().progress, "01-a")).toBe(true);
    expect(reopened.getSnapshot().progress.lessons["01-a"].completedAt).toBe(NOW);
  });

  it("바뀌면 화면에 알린다", () => {
    const { storage } = fakeStorage();
    const store = createProgressStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.markComplete("01-a");
    store.markComplete("01-a"); // 이미 완료: 다시 알리지 않음
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.recordFirstAttempt("01-a", "q1", 0, true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("저장에 실패해도 지금은 계속 동작하고 saveFailed 로 알린다", () => {
    const { storage } = fakeStorage({}, { failWrites: true });
    const store = createProgressStore(() => storage);
    store.markComplete("01-a");
    const state = store.getSnapshot();
    expect(state.saveFailed).toBe(true);
    expect(isCompleted(state.progress, "01-a")).toBe(true); // 메모리에는 남아 있음
  });

  it("저장소 자체가 막힌 브라우저에서도 멈추지 않는다", () => {
    const store = createProgressStore(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(store.getSnapshot().saveFailed).toBe(true);
    store.markComplete("01-a");
    expect(isCompleted(store.getSnapshot().progress, "01-a")).toBe(true);
  });

  it("다른 탭에서 바뀐 값을 다시 읽는다", () => {
    const { storage, data } = fakeStorage();
    const store = createProgressStore(() => storage);
    expect(isCompleted(store.getSnapshot().progress, "01-a")).toBe(false);
    data.set(STORAGE_KEY, JSON.stringify({ version: 1, lessons: { "01-a": { quiz: {}, completedAt: NOW } } }));
    store.reload();
    expect(isCompleted(store.getSnapshot().progress, "01-a")).toBe(true);
  });
});

describe("parseProgress", () => {
  it("망가진 값이나 다른 버전은 빈 진행도로 시작한다", () => {
    for (const raw of ["{망가짐", "null", "[]", JSON.stringify({ version: 2, lessons: {} })]) {
      expect(parseProgress(raw)).toEqual({ version: 1, lessons: {} });
    }
  });

  it("일부만 망가졌으면 멀쩡한 기록은 살린다", () => {
    const raw = JSON.stringify({
      version: 1,
      lessons: {
        "01-a": { completedAt: NOW, quiz: { q1: { firstChoice: 0, correct: true, answeredAt: NOW }, q2: "망가짐" } },
        "02-b": "망가짐",
      },
    });
    expect(parseProgress(raw)).toEqual({
      version: 1,
      lessons: { "01-a": { completedAt: NOW, quiz: { q1: { firstChoice: 0, correct: true, answeredAt: NOW } } } },
    });
  });
});

describe("firstAttemptScore", () => {
  const progress = parseProgress(
    JSON.stringify({
      version: 1,
      lessons: {
        "01-a": {
          quiz: {
            q1: { firstChoice: 0, correct: true, answeredAt: NOW },
            q2: { firstChoice: 1, correct: false, answeredAt: NOW },
            old: { firstChoice: 0, correct: true, answeredAt: NOW }, // 지금은 없는 문제
          },
        },
      },
    }),
  );

  it("지금 레슨의 문제만 센다", () => {
    expect(firstAttemptScore(progress, "01-a", ["q1", "q2", "q3"])).toEqual({ attempted: 2, correct: 1, total: 3, finished: false });
    expect(firstAttemptScore(progress, "01-a", ["q1", "q2"])).toEqual({ attempted: 2, correct: 1, total: 2, finished: true });
  });

  it("기록이 없는 레슨", () => {
    expect(firstAttemptScore(progress, "02-b", ["q1"])).toEqual({ attempted: 0, correct: 0, total: 1, finished: false });
  });
});
