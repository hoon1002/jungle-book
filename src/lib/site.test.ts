import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITE } from "./site";

describe("SITE", () => {
  it("바탕색이 디자인 토큰 --color-night 와 같다", async () => {
    const css = await readFile(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const night = css.match(/--color-night:\s*(#[0-9a-fA-F]+)/)?.[1];
    expect(night?.toLowerCase()).toBe(SITE.backgroundColor.toLowerCase());
  });
});
