/**
 * lesson.md 본문(마크다운) → HTML.
 * - `:::patch ... :::` 블록 → <aside class="patch-block" data-verified-patch="..."> (패치 의존 정보)
 * - `![설명](./images/파일.png)` → 빌드 때 복사되는 /lesson-assets/<slug>/images/파일.png 로 주소 변경
 * 본문에 직접 쓴 HTML 태그는 화면에 넣지 않는다 (remark-rehype 기본 동작).
 */
import type { Root as MdRoot, Text } from "mdast";
import type {} from "mdast-util-directive"; // :::directive 노드 타입
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
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(file), ...result };
}
