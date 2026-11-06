/**
 * 진행도 저장소. 이 기기(브라우저 localStorage)에만 저장한다. 로그인 없음.
 *
 * 규칙
 * - 화면은 이 파일의 함수로만 진행도를 읽고 쓴다. 나중에 계정 연동을 붙이면 이 파일만 바꾼다.
 * - 퀴즈는 "첫 시도"만 기록한다. 다시 풀어도 덮어쓰지 않는다 (spec 지표: 첫 시도 정답률).
 * - 저장에 실패해도(저장소가 막힌 브라우저 등) 지금 열려 있는 동안은 메모리로 계속 동작하고,
 *   saveFailed 로 알려서 화면이 "이 기기에 저장되지 않았어요"를 보여 준다.
 */

export const STORAGE_KEY = "jungle-textbook:v1";

export type QuizAttempt = { firstChoice: number; correct: boolean; answeredAt: string };
export type LessonProgress = { completedAt?: string; quiz: Record<string, QuizAttempt> };
export type Progress = { version: 1; lessons: Record<string, LessonProgress> };

export type ProgressState = {
  /** false 면 아직 기기 저장소를 읽기 전 (정적 HTML을 만들 때, 페이지가 막 열렸을 때) */
  ready: boolean;
  progress: Progress;
  /** 기기에 저장하지 못했음 */
  saveFailed: boolean;
};

export const emptyProgress = (): Progress => ({ version: 1, lessons: {} });

/** 빌드할 때와 페이지가 막 열렸을 때 쓰는 상태 (기기 저장소를 아직 모름) */
export const NOT_READY: ProgressState = Object.freeze({ ready: false, progress: emptyProgress(), saveFailed: false });

// ── 읽기: 저장된 값이 망가져 있어도 멈추지 않고 빈 진행도로 시작한다 ──

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.lessons)) return emptyProgress();

  const lessons: Progress["lessons"] = {};
  for (const [slug, value] of Object.entries(data.lessons)) {
    if (!isRecord(value)) continue;
    const quiz: LessonProgress["quiz"] = {};
    if (isRecord(value.quiz)) {
      for (const [id, a] of Object.entries(value.quiz)) {
        if (isRecord(a) && typeof a.firstChoice === "number" && typeof a.correct === "boolean") {
          quiz[id] = { firstChoice: a.firstChoice, correct: a.correct, answeredAt: String(a.answeredAt ?? "") };
        }
      }
    }
    lessons[slug] = { quiz, ...(typeof value.completedAt === "string" ? { completedAt: value.completedAt } : {}) };
  }
  return { version: 1, lessons };
}

// ── 저장소 ──

export type ProgressStore = ReturnType<typeof createProgressStore>;

/** getStorage 를 바꿔 끼울 수 있게 만들어 테스트에서 가짜 저장소를 쓴다 */
export function createProgressStore(getStorage: () => Storage | null, now = () => new Date().toISOString()) {
  let state: ProgressState | null = null;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  const safeStorage = (): Storage | null => {
    try {
      return getStorage(); // 저장소가 막힌 브라우저는 여기서 오류를 낸다
    } catch {
      return null;
    }
  };

  const load = (): ProgressState => {
    const storage = safeStorage();
    if (!storage) return { ready: true, progress: emptyProgress(), saveFailed: true };
    try {
      return { ready: true, progress: parseProgress(storage.getItem(STORAGE_KEY)), saveFailed: false };
    } catch {
      return { ready: true, progress: emptyProgress(), saveFailed: true };
    }
  };

  const getSnapshot = (): ProgressState => (state ??= load());

  const save = (progress: Progress) => {
    let saveFailed = false;
    try {
      const storage = safeStorage();
      if (!storage) throw new Error("storage unavailable");
      storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      saveFailed = true; // 용량 부족, 저장 차단 등. 메모리에는 남긴다
    }
    state = { ready: true, progress, saveFailed };
    notify();
  };

  const updateLesson = (slug: string, update: (lesson: LessonProgress) => LessonProgress | null) => {
    const { progress } = getSnapshot();
    const next = update(progress.lessons[slug] ?? { quiz: {} });
    if (next) save({ ...progress, lessons: { ...progress.lessons, [slug]: next } });
  };

  return {
    getSnapshot,

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** 다른 탭에서 진행도가 바뀌었을 때 다시 읽는다 */
    reload() {
      state = null;
      notify();
    },

    /** 퀴즈 첫 시도만 기록한다. 이미 기록이 있으면 아무것도 하지 않는다 */
    recordFirstAttempt(slug: string, questionId: string, firstChoice: number, correct: boolean) {
      updateLesson(slug, (lesson) =>
        lesson.quiz[questionId]
          ? null
          : { ...lesson, quiz: { ...lesson.quiz, [questionId]: { firstChoice, correct, answeredAt: now() } } },
      );
    },

    markComplete(slug: string) {
      updateLesson(slug, (lesson) => (lesson.completedAt ? null : { ...lesson, completedAt: now() }));
    },
  };
}

// ── 화면에서 쓰는 계산 ──

export function isCompleted(progress: Progress, slug: string): boolean {
  return Boolean(progress.lessons[slug]?.completedAt);
}

/** 지금 레슨에 있는 문제 기준의 첫 시도 결과 (지워진 문제의 기록은 세지 않는다) */
export function firstAttemptScore(progress: Progress, slug: string, questionIds: string[]) {
  const quiz = progress.lessons[slug]?.quiz ?? {};
  const attempted = questionIds.filter((id) => quiz[id]);
  return {
    attempted: attempted.length,
    correct: attempted.filter((id) => quiz[id].correct).length,
    total: questionIds.length,
    finished: questionIds.length > 0 && attempted.length === questionIds.length,
  };
}
