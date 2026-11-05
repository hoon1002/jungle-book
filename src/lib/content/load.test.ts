import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LESSONS_DIR, loadLessons, type Problem } from "./load";

const TEMPLATE_DIR = path.join(process.cwd(), "content", "_template");

const LESSON_MD = `---
title: 어디서 시작할까?
goal: 시작 위치를 고를 수 있다
order: 1
status: 공개
verifiedPatch: "26.22"
review: 홍길동(다이아)
summary:
  - 하나
  - 둘
  - 셋
sources:
  - title: 출처 1
    url: https://example.com/1
    checkedAt: 2026-11-05
  - title: 출처 2
    url: https://example.com/2
    checkedAt: 2026-11-05
---

## 원칙

본문

:::patch
수치
:::

![도식](./images/route.svg)
`;

const QUIZ_YAML = ["q1", "q2", "q3"]
  .map(
    (id) => `- id: ${id}
  time: "1:25"
  known: 아는 것
  unknown: 모르는 것
  question: 무엇을 할까?
  choices:
    - { text: A, correct: true, why: 이유 }
    - { text: B, correct: false, why: 이유 }
    - { text: C, correct: false, why: 이유 }
`,
  )
  .join("");

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "jungle-lessons-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

async function writeLesson(slug: string, files: Record<string, string>) {
  for (const [name, content] of Object.entries(files)) {
    const p = path.join(dir, slug, name);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, content);
  }
}

const goodFiles = { "lesson.md": LESSON_MD, "quiz.yaml": QUIZ_YAML, "images/route.svg": "<svg/>" };
const errorsOf = (problems: Problem[]) => problems.filter((p) => p.level === "error").map((p) => p.message);

describe("loadLessons — 실제 content/lessons", () => {
  it("오류 없이 읽히고, 순서대로 정렬된다", async () => {
    const { lessons, problems } = await loadLessons(LESSONS_DIR);
    expect(errorsOf(problems)).toEqual([]);
    expect(lessons.map((l) => [l.order, l.status])).toEqual([
      [1, "공개"],
      [2, "준비중"],
      [3, "준비중"],
    ]);
  });

  it("예시 레슨 본문의 패치 블록과 이미지 주소가 변환된다", async () => {
    const { lessons } = await loadLessons(LESSONS_DIR);
    const first = lessons[0];
    if (first.status !== "공개") throw new Error("첫 레슨은 공개여야 함");
    expect(first.html).toContain('<aside class="patch-block" data-verified-patch="예시">');
    expect(first.html).toContain('src="/lesson-assets/01-first-clear/images/example-diagram.svg"');
    expect(first.quiz).toHaveLength(4);
  });
});

describe("loadLessons — 양식 점검", () => {
  it("올바른 레슨은 오류도 경고도 없다", async () => {
    await writeLesson("01-good", goodFiles);
    const { lessons, problems } = await loadLessons(dir);
    expect(problems).toEqual([]);
    expect(lessons).toHaveLength(1);
  });

  it("템플릿을 복사해 공개로 바꾸면 오류 없이 통과한다 (템플릿과 양식 규칙이 어긋나지 않았는지)", async () => {
    await fs.cp(TEMPLATE_DIR, path.join(dir, "01-from-template"), { recursive: true });
    const lessonPath = path.join(dir, "01-from-template", "lesson.md");
    const md = await fs.readFile(lessonPath, "utf8");
    await fs.writeFile(lessonPath, md.replace("status: 준비중", "status: 공개"));
    const { problems } = await loadLessons(dir);
    expect(errorsOf(problems)).toEqual([]);
  });

  it("폴더 이름 규칙을 검사한다", async () => {
    await writeLesson("첫-레슨", goodFiles);
    expect(errorsOf((await loadLessons(dir)).problems)[0]).toContain("폴더 이름");
  });

  it(":::patch 블록이 있는데 검증 패치가 없으면 오류", async () => {
    await writeLesson("01-good", { ...goodFiles, "lesson.md": LESSON_MD.replace('verifiedPatch: "26.22"\n', "") });
    expect(errorsOf((await loadLessons(dir)).problems)).toEqual([
      ":::patch 블록이 있으면 머리말에 검증 패치(verifiedPatch)를 적어야 합니다",
    ]);
  });

  it("원칙 제목이 없으면 오류", async () => {
    await writeLesson("01-good", { ...goodFiles, "lesson.md": LESSON_MD.replace("## 원칙", "## 개요") });
    expect(errorsOf((await loadLessons(dir)).problems)[0]).toContain("## 원칙");
  });

  it("본문이 가리키는 이미지 파일이 없으면 오류", async () => {
    await writeLesson("01-good", { "lesson.md": LESSON_MD, "quiz.yaml": QUIZ_YAML });
    expect(errorsOf((await loadLessons(dir)).problems)).toEqual(["이미지 파일을 찾을 수 없습니다: images/route.svg"]);
  });

  it("공개 레슨에 quiz.yaml 이 없으면 오류", async () => {
    await writeLesson("01-good", { "lesson.md": LESSON_MD, "images/route.svg": "<svg/>" });
    expect(errorsOf((await loadLessons(dir)).problems)[0]).toContain("quiz.yaml");
  });

  it("YAML 문법 오류는 파일 기준 줄 번호와 해결 방법을 알려 준다", async () => {
    // 가장 흔한 실수: 값 안에 ": " 를 넣음. 제목은 파일 2번째 줄(--- 다음)
    const broken = LESSON_MD.replace("title: 어디서 시작할까?", "title: 질문: 어디서 시작할까?");
    await writeLesson("01-good", { ...goodFiles, "lesson.md": broken });
    const [message] = errorsOf((await loadLessons(dir)).problems);
    expect(message).toMatch(/^2번째 줄: YAML 문법 오류/);
    expect(message).toContain("따옴표");
  });

  it("값을 따옴표로 감싸면 콜론이 들어가도 괜찮다", async () => {
    const quoted = LESSON_MD.replace("title: 어디서 시작할까?", 'title: "질문: 어디서 시작할까?"');
    await writeLesson("01-good", { ...goodFiles, "lesson.md": quoted });
    const { lessons, problems } = await loadLessons(dir);
    expect(errorsOf(problems)).toEqual([]);
    expect(lessons[0].title).toBe("질문: 어디서 시작할까?");
  });

  it("순서 번호가 겹치면 오류", async () => {
    await writeLesson("01-good", goodFiles);
    await writeLesson("02-also-one", goodFiles);
    expect(errorsOf((await loadLessons(dir)).problems)).toEqual([
      "순서(order) 1번이 겹칩니다: 01-good, 02-also-one",
    ]);
  });

  it("권장 사항은 경고로만 알려 준다", async () => {
    const oneSource = LESSON_MD.replace(/  - title: 출처 2\n.*\n.*\n/, "");
    await writeLesson("01-good", { ...goodFiles, "lesson.md": oneSource });
    const { lessons, problems } = await loadLessons(dir);
    expect(lessons).toHaveLength(1);
    expect(problems.map((p) => [p.level, p.message])).toEqual([["warning", "출처가 1개입니다 (2개 이상 권장)"]]);
  });

  it("머리말에 오류가 있어도 본문·퀴즈 오류까지 한 번에 알려 준다", async () => {
    const brokenMd = LESSON_MD.replace('verifiedPatch: "26.22"\n', "").replace(/sources:\n(  .*\n)+/, "sources: []\n");
    const brokenQuiz = QUIZ_YAML.replace("{ text: A, correct: true, why: 이유 }", "{ text: A, correct: false, why: 이유 }");
    await writeLesson("01-good", { ...goodFiles, "lesson.md": brokenMd, "quiz.yaml": brokenQuiz });
    const { lessons, problems } = await loadLessons(dir);
    expect(lessons).toEqual([]);
    expect(errorsOf(problems)).toEqual([
      "출처(sources) → 출처가 최소 1개 있어야 합니다",
      ":::patch 블록이 있으면 머리말에 검증 패치(verifiedPatch)를 적어야 합니다",
      "문제 1번 › 선택지(choices) → 정답(correct: true)인 선택지가 하나 이상 있어야 합니다",
    ]);
  });
});
