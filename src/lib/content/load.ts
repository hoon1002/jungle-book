/**
 * content/lessons/ 의 레슨 폴더를 읽고 양식을 점검한다.
 * 빌드할 때(서버 쪽)에서만 실행된다. 브라우저 코드에서 import 하지 않는다.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { parseDocument } from "yaml";
import type { z } from "zod";
import { renderLessonMarkdown } from "./markdown";
import {
  describePath,
  lessonMetaSchema,
  quizSchema,
  type PublishedMeta,
  type Quiz,
} from "./schema";

export const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");

export type Problem = { level: "error" | "warning"; file: string; message: string };

export type PublishedLesson = {
  slug: string;
  status: "공개";
  order: number;
  title: string;
  meta: PublishedMeta;
  html: string;
  quiz: Quiz;
  imageCount: number;
};

export type DraftLesson = {
  slug: string;
  status: "준비중";
  order: number;
  title: string;
  goal?: string;
};

export type Lesson = PublishedLesson | DraftLesson;

const SLUG_PATTERN = /^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RECOMMENDED_QUIZ = { min: 3, max: 5 };

export async function loadLessons(
  dir: string = LESSONS_DIR,
): Promise<{ lessons: Lesson[]; problems: Problem[] }> {
  const problems: Problem[] = [];
  const lessons: Lesson[] = [];
  const rel = (...p: string[]) => path.relative(process.cwd(), path.join(dir, ...p));

  let entries: string[];
  try {
    entries = (await fs.readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_"))
      .map((e) => e.name)
      .sort();
  } catch {
    return { lessons, problems: [{ level: "error", file: rel(), message: "레슨 폴더를 찾을 수 없습니다" }] };
  }

  for (const slug of entries) {
    const before = problems.length;
    const lesson = await loadOne(dir, slug, problems, rel);
    const hasError = problems.slice(before).some((p) => p.level === "error");
    if (lesson && !hasError) lessons.push(lesson);
  }

  if (entries.length === 0) {
    problems.push({ level: "error", file: rel(), message: "레슨이 하나도 없습니다" });
  }

  // 순서 번호가 겹치면 홈의 강좌 지도 순서가 애매해진다
  const byOrder = new Map<number, string[]>();
  for (const l of lessons) byOrder.set(l.order, [...(byOrder.get(l.order) ?? []), l.slug]);
  for (const [order, slugs] of byOrder) {
    if (slugs.length > 1) {
      problems.push({ level: "error", file: rel(), message: `순서(order) ${order}번이 겹칩니다: ${slugs.join(", ")}` });
    }
  }

  lessons.sort((a, b) => a.order - b.order);
  return { lessons, problems };
}

async function loadOne(
  dir: string,
  slug: string,
  problems: Problem[],
  rel: (...p: string[]) => string,
): Promise<Lesson | null> {
  const lessonFile = rel(slug, "lesson.md");
  const quizFile = rel(slug, "quiz.yaml");
  const err = (file: string, message: string) => problems.push({ level: "error", file, message });
  const warn = (file: string, message: string) => problems.push({ level: "warning", file, message });

  if (!SLUG_PATTERN.test(slug)) {
    err(rel(slug), "폴더 이름은 01-first-clear 처럼 두 자리 번호 + 영어 소문자·숫자·하이픈으로 지어 주세요 (주소에 쓰입니다)");
    return null;
  }

  // ── lesson.md ──
  const raw = await readText(path.join(dir, slug, "lesson.md"));
  if (raw === null) {
    err(lessonFile, "lesson.md 파일이 없습니다");
    return null;
  }
  const fm = splitFrontmatter(raw);
  if (!fm) {
    err(lessonFile, "파일 맨 위에 --- 로 감싼 머리말이 있어야 합니다");
    return null;
  }
  const metaData = parseYaml(fm.frontmatter, lessonFile, problems, 1);
  if (metaData === undefined) return null;
  const metaResult = lessonMetaSchema.safeParse(metaData ?? {});
  if (!metaResult.success) reportZod(metaResult.error, lessonFile, problems, "머리말");
  const meta = metaResult.success ? metaResult.data : null;

  if (meta?.status === "준비중") {
    return { slug, status: "준비중", order: meta.order, title: meta.title, goal: meta.goal };
  }
  // 머리말에 오류가 있어도 공개 레슨이면 본문·퀴즈까지 끝까지 점검해서, 고칠 것을 한 번에 다 알려 준다
  const rawMeta = isRecord(metaData) ? metaData : {};
  if (!meta && rawMeta.status !== "공개") return null;
  const verifiedPatch = meta ? meta.verifiedPatch : typeof rawMeta.verifiedPatch === "string" ? rawMeta.verifiedPatch : undefined;

  // ── 본문 ──
  const md = await renderLessonMarkdown(fm.body, {
    slug,
    verifiedPatch,
    imageSize: (file) => readImageSize(path.join(dir, slug, "images", file)),
  });
  md.problems.forEach((m) => err(lessonFile, m));
  if (!md.headings.includes("원칙")) {
    err(lessonFile, "본문에 ## 원칙 제목이 있어야 합니다 (패치가 바뀌어도 유지되는 판단 기준)");
  }
  if (md.hasPatchBlock && !verifiedPatch) {
    err(lessonFile, ":::patch 블록이 있으면 머리말에 검증 패치(verifiedPatch)를 적어야 합니다");
  }
  if (!md.hasPatchBlock && verifiedPatch) {
    warn(lessonFile, "검증 패치(verifiedPatch)는 있는데 :::patch 블록이 없습니다");
  }
  for (const img of md.localImages) {
    if (!(await exists(path.join(dir, slug, "images", img)))) {
      err(lessonFile, `이미지 파일을 찾을 수 없습니다: images/${img}`);
    }
  }
  if (md.imageCount === 0) warn(lessonFile, "시각 자료(이미지)가 없습니다 (권장 사항)");
  if (meta) {
    if (meta.sources.length < 2) warn(lessonFile, `출처가 ${meta.sources.length}개입니다 (2개 이상 권장)`);
    if (meta.review.replace(/\s/g, "") === "검수전") warn(lessonFile, "아직 검수 전입니다");
    if (meta.isExample) {
      warn(lessonFile, "예시(더미) 레슨이 공개 상태입니다. 실제 공개 전에 진짜 내용으로 바꾸거나 준비중으로 돌려 주세요");
    }
  }

  // ── quiz.yaml ──
  const quiz = await loadQuiz(path.join(dir, slug, "quiz.yaml"), quizFile, problems);
  if (!meta || !quiz) return null;

  return {
    slug,
    status: "공개",
    order: meta.order,
    title: meta.title,
    meta,
    html: md.html,
    quiz,
    imageCount: md.imageCount,
  };
}

async function loadQuiz(absPath: string, file: string, problems: Problem[]): Promise<Quiz | null> {
  const quizRaw = await readText(absPath);
  if (quizRaw === null) {
    problems.push({ level: "error", file, message: "공개 레슨에는 quiz.yaml 이 있어야 합니다" });
    return null;
  }
  const quizData = parseYaml(quizRaw, file, problems, 0);
  if (quizData === undefined) return null;
  const quizResult = quizSchema.safeParse(quizData);
  if (!quizResult.success) {
    reportZod(quizResult.error, file, problems, "quiz.yaml", "문제");
    return null;
  }
  const quiz = quizResult.data;
  if (quiz.length < RECOMMENDED_QUIZ.min || quiz.length > RECOMMENDED_QUIZ.max) {
    problems.push({
      level: "warning",
      file,
      message: `문제가 ${quiz.length}개입니다 (${RECOMMENDED_QUIZ.min}~${RECOMMENDED_QUIZ.max}개 권장)`,
    });
  }
  return quiz;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ── 화면(빌드)에서 쓰는 함수 ──────────────────────────────────

let cache: Promise<Lesson[]> | null = null;

/** 오류가 하나라도 있으면 빌드를 멈춘다 */
export function getLessons(): Promise<Lesson[]> {
  cache ??= loadLessons().then(({ lessons, problems }) => {
    const errors = problems.filter((p) => p.level === "error");
    if (errors.length > 0) {
      cache = null; // 고친 뒤 개발 서버에서 다시 읽을 수 있게
      throw new Error(`레슨 양식 오류 ${errors.length}개\n${errors.map(formatProblem).join("\n")}`);
    }
    return lessons;
  });
  return cache;
}

export function formatProblem(p: Problem): string {
  return `${p.file}: ${p.message}`;
}

// ── 도우미 ───────────────────────────────────────────────────

function splitFrontmatter(raw: string): { frontmatter: string; body: string } | null {
  const m = raw.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n([\s\S]*))?$/);
  return m ? { frontmatter: m[1], body: m[2] ?? "" } : null;
}

/** 자주 나는 YAML 실수별 안내 */
const YAML_HINTS: Partial<Record<string, string>> = {
  BLOCK_AS_IMPLICIT_KEY: '값 안에 ": "(콜론+띄어쓰기)가 있으면 값 전체를 "따옴표"로 감싸 주세요. 들여쓰기도 확인해 주세요',
  BAD_INDENT: "들여쓰기(앞 칸 띄우기)가 위아래 줄과 맞는지 확인해 주세요",
  MISSING_CHAR: "따옴표나 괄호의 짝이 맞는지 확인해 주세요",
  DUPLICATE_KEY: "같은 칸 이름이 두 번 나옵니다",
  TAB_AS_INDENT: "들여쓰기에 탭 대신 스페이스를 써 주세요",
};

/** YAML 문법 오류면 undefined 를 돌려주고 줄 번호와 함께 오류를 남긴다 */
function parseYaml(src: string, file: string, problems: Problem[], lineOffset: number): unknown {
  const doc = parseDocument(src);
  if (doc.errors.length > 0) {
    // 한 실수가 같은 줄에 오류를 여러 개 만들 수 있어 줄+종류로 한 번만 알린다
    const seen = new Set<string>();
    for (const e of doc.errors) {
      const line = e.linePos?.[0]?.line;
      const key = `${line}:${e.code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const where = line ? `${line + lineOffset}번째 줄: ` : "";
      const hint = YAML_HINTS[e.code] ?? "들여쓰기, 콜론(:) 뒤 띄어쓰기, 따옴표 짝을 확인해 주세요";
      problems.push({ level: "error", file, message: `${where}YAML 문법 오류 — ${hint} (${e.code})` });
    }
    return undefined;
  }
  return doc.toJS();
}

function reportZod(error: z.ZodError, file: string, problems: Problem[], emptyLabel: string, rootLabel?: string) {
  for (const issue of error.issues) {
    const where = issue.path.length > 0 ? describePath(issue.path, rootLabel) : emptyLabel;
    const hint = issue.code === "unrecognized_keys" ? " (칸 이름 오타인지 확인해 주세요)" : "";
    problems.push({ level: "error", file, message: `${where} → ${issue.message}${hint}` });
  }
}

async function readText(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

/** 이미지 가로·세로 (읽지 못하면 null: 파일이 없으면 위에서 따로 오류로 알린다) */
async function readImageSize(file: string): Promise<{ width: number; height: number } | null> {
  try {
    const { width, height } = await sharp(file).metadata();
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
