/*
 * 정글 교과서 서비스 워커: 한 번 열어 본 페이지를 인터넷 없이도 다시 열 수 있게 이 기기에 저장한다.
 * (실제 사이트에서만 켜진다. 개발 서버에서는 src/components/pwa/ServiceWorker.tsx 가 켜지 않는다)
 *
 * - 페이지(HTML): 인터넷이 되면 늘 새로 받고 저장본도 갱신한다. 안 되면 저장본, 그것도 없으면 /offline 안내.
 * - /_next/static/ 파일: 이름에 내용 지문이 붙어 있어 절대 바뀌지 않으므로 저장본을 먼저 쓴다.
 * - 화면 전환용 데이터(RSC): 손대지 않는다. 인터넷이 없어 실패하면 Next.js가 페이지 열기로 다시 시도하고,
 *   그때 위의 "페이지" 규칙이 저장본을 보여 준다.
 * - 그 밖의 파일(레슨 이미지, 아이콘): 저장본을 먼저 보여 주고, 뒤에서 새로 받아 둔다.
 *
 * 이 파일의 동작을 바꾸면 VERSION을 올린다. 새 버전이 켜질 때 예전 저장본은 지워진다.
 */
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const STATIC = `static-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE_PAGES = ["/", OFFLINE_URL];
const MAX_STATIC_FILES = 400;

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all(PRECACHE_PAGES.map(cachePage)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const current = new Set([PAGES, STATIC, ASSETS]);
      for (const name of await caches.keys()) {
        if (!current.has(name)) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

// 화면이 "이 페이지 저장해 둬"라고 알려 온다. 링크로 옮겨 다닌 페이지는 HTML을 따로 받지 않고,
// 첫 방문 때 받은 파일은 이 워커가 켜지기 전에 받아서 저장되지 않았기 때문이다
self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.type === "cache-page" && typeof data.url === "string") {
    event.waitUntil(Promise.all([cachePage(data.url), cacheFiles(data.files)]));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(pageNetworkFirst(request, url));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staticCacheFirst(request));
  } else if (isRscRequest(request, url)) {
    return;
  } else {
    const refresh = refreshAsset(request);
    event.waitUntil(refresh.then(noop, noop));
    event.respondWith(
      caches
        .open(ASSETS)
        .then((cache) => cache.match(request))
        .then((hit) => hit || refresh),
    );
  }
});

function noop() {}

function isRscRequest(request, url) {
  return request.headers.get("RSC") === "1" || isRscUrl(url);
}

function isRscUrl(url) {
  return url.searchParams.has("_rsc") || url.pathname.endsWith(".txt");
}

/** 같은 페이지는 ?step= 이 달라도 같은 HTML이다 (단계는 화면에서 바꾼다) */
function pageKey(url) {
  let path = url.pathname.replace(/\.html$/, "");
  if (path.length > 1) path = path.replace(/\/$/, "");
  return new URL(path, self.location.origin).href;
}

async function pageNetworkFirst(request, url) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(pageKey(url), response.clone());
    return response;
  } catch {
    return (await cache.match(pageKey(url))) || (await cache.match(pageKey(new URL(OFFLINE_URL, url)))) || Response.error();
  }
}

/** 페이지 HTML과, 그 페이지가 쓰는 /_next/static/ 파일(화면 코드·스타일·글꼴)을 함께 저장한다 */
async function cachePage(path) {
  try {
    const url = new URL(path, self.location.origin);
    if (url.origin !== self.location.origin) return;
    // no-cache: 서버에 바뀌었는지만 물어본다. 그대로면 다시 내려받지 않는다
    const response = await fetch(url, { cache: "no-cache" });
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.includes("text/html")) return;

    const html = await response.clone().text();
    await (await caches.open(PAGES)).put(pageKey(url), response);

    const statics = await caches.open(STATIC);
    const files = new Set(html.match(/\/_next\/static\/[^"'\\\s)<>]+?\.(?:js|css|woff2)/g) || []);
    await Promise.all(
      [...files].map(async (file) => {
        if (!(await statics.match(file))) await statics.add(file).catch(noop);
      }),
    );
    await trim(statics, MAX_STATIC_FILES);
  } catch {
    // 인터넷이 끊겼거나 실패해도 괜찮다. 다음에 그 페이지를 열 때 다시 저장한다
  }
}

/** 화면이 이미 받은 파일 목록을 저장한다. 대부분 브라우저에 남아 있어서 다시 내려받지 않는다 */
async function cacheFiles(files) {
  if (!Array.isArray(files)) return;
  const statics = await caches.open(STATIC);
  const assets = await caches.open(ASSETS);
  await Promise.all(
    files.map(async (file) => {
      try {
        const url = new URL(file, self.location.origin);
        if (url.origin !== self.location.origin || isRscUrl(url)) return;
        const cache = url.pathname.startsWith("/_next/static/") ? statics : assets;
        if (!(await cache.match(url))) await cache.add(url);
      } catch {
        // 받지 못한 파일은 건너뛴다
      }
    }),
  );
  await trim(statics, MAX_STATIC_FILES);
}

async function staticCacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    await trim(cache, MAX_STATIC_FILES);
  }
  return response;
}

async function refreshAsset(request) {
  const response = await fetch(request);
  if (response.ok) await (await caches.open(ASSETS)).put(request, response.clone());
  return response;
}

/** 사이트를 여러 번 새로 올리면 예전 파일이 쌓이므로, 오래된 것부터 지워 개수를 제한한다 */
async function trim(cache, max) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}
