import { describe, expect, it } from "vitest";
import { renderLessonMarkdown } from "./markdown";

const render = (md: string, verifiedPatch = "26.22") => renderLessonMarkdown(md, { slug: "01-test", verifiedPatch });

describe("renderLessonMarkdown", () => {
  it(":::patch 블록을 안내 줄이 달린 aside 로 바꾼다", async () => {
    const { html, hasPatchBlock } = await render(":::patch\n수치\n:::");
    expect(hasPatchBlock).toBe(true);
    expect(html).toContain('<aside class="patch-block" data-verified-patch="26.22">');
    expect(html).toContain('<span class="patch-label__version">패치 26.22 기준</span>');
    expect(html).toContain("<p>수치</p>");
  });

  it("레슨 이미지 주소를 사이트 주소로 바꾼다", async () => {
    const { html, localImages } = await render("![도식](./images/route.svg)");
    expect(localImages).toEqual(["route.svg"]);
    expect(html).toContain('src="/lesson-assets/01-test/images/route.svg"');
  });

  it("레슨 이미지에 크기와 늦게 받기(lazy)를 적는다", async () => {
    const { html } = await renderLessonMarkdown("![도식](./images/route.svg)", {
      slug: "01-test",
      imageSize: async () => ({ width: 640, height: 360 }),
    });
    expect(html).toContain('width="640" height="360" loading="lazy" decoding="async"');
  });

  it("직접 쓴 HTML과 javascript: 링크는 화면에 넣지 않는다", async () => {
    const { html } = await render('<script>alert(1)</script>\n\n[누르기](javascript:alert(1)) <img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onerror");
    expect(html).toContain("누르기");
  });

  it("평범한 글 속 콜론은 블록으로 오해하지 않는다", async () => {
    const { html, problems } = await render("Tip:this 와 1:25");
    expect(problems).toEqual([]);
    expect(html).toContain("Tip:this 와 1:25");
  });

  it("모르는 블록 이름과 띄어쓰기 있는 이미지 이름을 알려 준다", async () => {
    const { problems } = await render(":::wrong\nx\n:::\n\n![a](./images/route map.svg)");
    expect(problems).toHaveLength(2);
    expect(problems).toEqual(
      expect.arrayContaining([expect.stringContaining(":::wrong"), expect.stringContaining("띄어쓰기")]),
    );
  });
});
