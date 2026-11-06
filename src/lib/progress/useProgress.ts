"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createProgressStore, NOT_READY, STORAGE_KEY } from "./store";

/** 이 사이트의 진행도 저장소 (브라우저 localStorage) */
export const progressStore = createProgressStore(() => (typeof window === "undefined" ? null : window.localStorage));

/**
 * 화면에서 진행도를 읽는 훅.
 * 정적 HTML을 만들 때는 기기 저장소를 알 수 없으므로 NOT_READY 로 그리고,
 * 페이지가 열린 뒤 실제 값으로 다시 그린다 (useSyncExternalStore 가 화면 불일치 없이 처리).
 */
export function useProgress() {
  // 다른 탭에서 레슨을 끝냈으면 이 탭도 따라 바뀌게
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) progressStore.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, () => NOT_READY);
}
