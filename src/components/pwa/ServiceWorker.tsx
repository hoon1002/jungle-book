"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// 개발 서버에서는 끈다: 고친 화면이 저장본에 가려지지 않고 바로 보여야 한다
const enabled = () => process.env.NODE_ENV === "production" && "serviceWorker" in navigator;

/**
 * 오프라인 열람용 서비스 워커(public/sw.js)를 켜고, 주소가 바뀔 때마다 그 페이지를 저장해 달라고 알린다.
 * 링크로 옮겨 다니면 브라우저가 페이지 HTML을 새로 받지 않으므로, 알려 주지 않으면 저장되지 않는다.
 * https 주소(또는 localhost)에서만 동작한다. 그 밖에서는 아무 일도 하지 않고, 사이트는 그대로 쓸 수 있다.
 */
export function ServiceWorker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled()) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 등록에 실패해도 사이트는 그대로 쓸 수 있다 (오프라인 열람만 안 된다)
    });
  }, []);

  useEffect(() => {
    if (!enabled()) return;
    navigator.serviceWorker.ready.then((registration) => {
      // 서비스 워커가 켜지기 전에 받은 파일(첫 방문의 글꼴 조각, 아이콘 등)도 함께 저장해 달라고 넘긴다
      const files = performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((name) => name.startsWith(`${location.origin}/`));
      registration.active?.postMessage({ type: "cache-page", url: pathname, files });
    });
  }, [pathname]);

  return null;
}
