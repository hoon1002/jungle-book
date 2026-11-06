/**
 * lesson.md 본문(마크다운) → HTML.
 * - `:::patch ... :::` 블록 → <aside class="patch-block" data-verified-patch="..."> (패치 의존 정보)
 * - `![설명](./images/파일.png)` → 빌드 때 복사되는 /lesson-assets/<slug>/images/파일.png 로 주소 변경
 * 본문에 직접 쓴 HTML 태그는 화면에 넣지 않는다 (remark-rehype 기본 동작).
 */
import type { Element } from "hast";
import type { Root as MdRoot, Paragraph, Text } from "mdast";
import type {} from "mdast-util-directive"; // :::directive 노드 타입
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export const LESSON_ASSET_BASE = "/lesson-assets";
const KNOWN_BLOCKS = ["patch"];

export type MarkdownResult = {
  html: string;
  headings: string[];
  hasPatchBlock: boolean;
  /** images/ 안의 파일 이름 (존재 확인용) */
  localImages: string[];
  imageCount: number;
  problems: string[];
};

/**
 * 화면에 넣기 전 HTML 정리: GitHub와 같은 기본 규칙(javascript: 링크, 스크립트 등 제거)에
 * 우리 레슨이 쓰는 것(패치 블록 <aside>, 정해진 class 이름)만 더 허용한다.
 */
const SANITIZE_SCHEMA: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "aside"],
  attributes: {
    ...defaultSchema.attributes,
    aside: [["className", "patch-block"], "dataVerifiedPatch"],
    p: [...(defaultSchema.attributes?.p ?? []), ["className", "patch-label"]],
    span: [["className", "patch-label__version", "patch-label__note"]],
  },
};

function span(className: string, value: string): Element {
  return { type: "element", tagName: "span", properties: { className: [className] }, children: [{ type: "text", value }] };
}

export async function renderLessonMarkdown(
  markdown: string,
  opts: { slug: string; verifiedPatch?: string },
): Promise<MarkdownResult> {
  const result: Omit<MarkdownResult, "html"> = {
    headings: [],
    hasPatchBlock: false,
    localImages: [],
    imageCount: 0,
    problems: [],
  };

  const lessonPlugin = () => (tree: MdRoot) => {
    visit(tree, (node, index, parent) => {
      if (node.type === "heading") {
        result.headings.push(
          node.children.map((c) => ("value" in c ? c.value : "")).join("").trim(),
        );
      }

      if (node.type === "containerDirective") {
        if (!KNOWN_BLOCKS.includes(node.name)) {
          result.problems.push(`알 수 없는 블록 ":::${node.name}" (쓸 수 있는 블록: :::patch)`);
          return;
        }
        result.hasPatchBlock = true;
        node.data = {
          hName: "aside",
          hProperties: {
            className: ["patch-block"],
            dataVerifiedPatch: opts.verifiedPatch ?? "",
          },
        };
        // 블록 맨 앞에 "패치 xx 기준" 안내 줄을 실제 글자로 넣는다 (화면 읽기 프로그램도 읽을 수 있게)
        const label: Paragraph = {
          type: "paragraph",
          children: [],
          data: {
            hProperties: { className: ["patch-label"] },
            hChildren: [
              span("patch-label__version", `패치 ${opts.verifiedPatch ?? "?"} 기준`),
              span("patch-label__note", "새 패치에서 달라질 수 있는 정보예요"),
            ],
          },
        };
        node.children.unshift(label);
      }

      // `:이름` / `::이름` 형태는 블록이 아니라 그냥 글자로 되돌린다 (예: "Tip:this" 같은 문장 보호)
      if ((node.type === "textDirective" || node.type === "leafDirective") && parent && index !== undefined) {
        const prefix = node.type === "textDirective" ? ":" : "::";
        const inner = node.children.map((c) => ("value" in c ? c.value : "")).join("");
        const restored: Text = { type: "text", value: `${prefix}${node.name}${inner ? `[${inner}]` : ""}` };
        parent.children.splice(index, 1, restored as never);
        return index;
      }

      if (node.type === "image") {
        result.imageCount += 1;
        const url = node.url;
        if (/^https?:\/\//.test(url)) return;
        const match = url.match(/^(?:\.\/)?images\/(.+)$/);
        if (!match) {
          result.problems.push(`이미지 "${url}"는 레슨 폴더의 images/ 안에 넣고 ./images/파일이름 으로 적어 주세요`);
          return;
        }
        const file = decodeURIComponent(match[1]);
        result.localImages.push(file);
        node.url = `${LESSON_ASSET_BASE}/${opts.slug}/images/${encodeURI(file)}`;
      }
    });
  };

  // 마크다운 규칙상 주소에 띄어쓰기가 있으면 이미지로 인식되지 않고 글자로 보인다
  for (const m of markdown.matchAll(/!\[[^\]]*\]\(([^)]*\s[^)]*)\)/g)) {
    result.problems.push(`이미지 "${m[1]}"의 파일 이름에 띄어쓰기가 있습니다. 띄어쓰기 대신 - 를 써 주세요`);
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(lessonPlugin)
    .use(remarkRehype)
    .use(rehypeSanitize, SANITIZE_SCHEMA)
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(file), ...result };
}
