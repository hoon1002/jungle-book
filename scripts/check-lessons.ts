/**
 * npm run check:lessons — 레슨 양식 점검.
 * 오류가 있으면 실패(종료 코드 1)해서 빌드가 멈춘다. 경고는 알려 주기만 한다.
 */
import path from "node:path";
import { styleText } from "node:util";
import { LESSONS_DIR, loadLessons, type Problem } from "../src/lib/content/load";

async function main() {
  const { lessons, problems } = await loadLessons();
  const errors = problems.filter((p) => p.level === "error");
  const warnings = problems.filter((p) => p.level === "warning");

  console.log(styleText("bold", "\n정글 교과서 · 레슨 점검\n"));

  const loaded = new Map(lessons.map((l) => [l.slug, l]));
  const failed = new Set(errors.map((p) => slugOf(p.file)).filter((s): s is string => !!s && !loaded.has(s)));
  const slugs = [...loaded.keys(), ...failed].sort(); // 폴더 이름(번호) 순서
  const width = Math.max(0, ...slugs.map((s) => s.length));
  for (const slug of slugs) {
    const name = slug.padEnd(width);
    const l = loaded.get(slug);
    if (!l) {
      console.log(`  ${styleText("red", "✗")} ${name}  오류 있음`);
    } else if (l.status === "공개") {
      const tags = [`퀴즈 ${l.quiz.length}문제`, l.meta.isExample ? "예시" : null].filter(Boolean).join(" · ");
      console.log(`  ${styleText("green", "✓")} ${name}  공개 · ${tags}`);
    } else {
      console.log(`  ${styleText("gray", "·")} ${name}  준비중`);
    }
  }

  printGroup("경고", warnings, "yellow", "⚠");
  printGroup("오류", errors, "red", "✗");

  const total = slugs.length;
  const summary = `레슨 ${total}개 · 오류 ${errors.length} · 경고 ${warnings.length}`;
  console.log(`\n${errors.length > 0 ? styleText("red", `실패: ${summary}`) : styleText("green", `통과: ${summary}`)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

function printGroup(label: string, items: Problem[], color: "yellow" | "red", mark: string) {
  if (items.length === 0) return;
  console.log(styleText(color, `\n${label} ${items.length}개`));
  const byFile = new Map<string, string[]>();
  for (const p of items) byFile.set(p.file, [...(byFile.get(p.file) ?? []), p.message]);
  for (const [file, messages] of byFile) {
    console.log(`  ${styleText(color, mark)} ${file}`);
    for (const m of messages) console.log(`      ${m}`);
  }
}

/** content/lessons/<slug>/... → <slug> */
function slugOf(file: string): string | null {
  const relToLessons = path.relative(LESSONS_DIR, path.resolve(process.cwd(), file));
  const first = relToLessons.split(path.sep)[0];
  return first && !first.startsWith("..") ? first : null;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
