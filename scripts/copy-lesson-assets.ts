/**
 * 레슨 폴더의 images/ 를 public/lesson-assets/<slug>/images/ 로 복사한다.
 * 작성자는 레슨 폴더 안에만 이미지를 넣으면 되고, 사이트는 복사본을 보여 준다.
 * npm run dev / npm run build 전에 자동으로 실행된다. (개발 중 이미지를 추가했으면 개발 서버를 다시 켜기)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { LESSONS_DIR } from "../src/lib/content/load";
import { LESSON_ASSET_BASE } from "../src/lib/content/markdown";

const OUT_DIR = path.join(process.cwd(), "public", LESSON_ASSET_BASE);

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  const entries = await fs.readdir(LESSONS_DIR, { withFileTypes: true });
  let copied = 0;
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith("_") || e.name.startsWith(".")) continue;
    const from = path.join(LESSONS_DIR, e.name, "images");
    try {
      await fs.access(from);
    } catch {
      continue;
    }
    await fs.cp(from, path.join(OUT_DIR, e.name, "images"), { recursive: true });
    copied += 1;
  }
  console.log(`레슨 이미지 복사: ${copied}개 레슨 → public${LESSON_ASSET_BASE}/`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
