/**
 * 앱 아이콘 만들기: npm run icons
 *
 * 그림은 레슨 진행 바와 같은 표기다. 네모(읽기) → 동그라미(퀴즈) → 마름모(정리, 횃불색 = 지금 위치)를
 * 왼쪽 아래에서 오른쪽 위로 잇는다. 색은 globals.css 디자인 토큰에서 읽어 오므로 따로 적지 않는다.
 *
 * 만드는 파일 (결과물이라 직접 고치지 않는다. 바꾸려면 이 파일을 고치고 다시 실행)
 * - src/app/icon.svg          브라우저 탭 아이콘
 * - src/app/apple-icon.png    아이폰 홈 화면 (180px, 모서리는 iOS가 둥글게 깎는다)
 * - public/icons/icon-*.png   안드로이드·PC 설치용 (192, 512)
 * - public/icons/maskable-512.png  안드로이드가 원·물방울 모양으로 잘라 쓰는 용도 (가장자리까지 바탕색)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();

async function readTokens() {
  const css = await readFile(path.join(ROOT, "src/app/globals.css"), "utf8");
  const token = (name: string) => {
    const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`));
    if (!m) throw new Error(`globals.css에서 --color-${name} 값을 찾지 못했어요.`);
    return m[1];
  };
  return { night: token("night"), bone: token("bone"), torch: token("torch") };
}

type Colors = Awaited<ReturnType<typeof readTokens>>;

/** rounded: 모서리를 둥글게(투명) 깎을지. 안드로이드 maskable·아이폰용은 가장자리까지 채운다 */
function iconSvg(c: Colors, { rounded }: { rounded: boolean }) {
  // 안드로이드 maskable 아이콘은 가운데 지름 80% 원 안만 보장된다. 그림은 모두 그 안에 둔다.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${rounded ? 'rx="112"' : ""} fill="${c.night}"/>
  <path d="M156 356 L356 156" stroke="${c.bone}" stroke-opacity="0.5" stroke-width="16" stroke-linecap="round"/>
  <rect x="122" y="322" width="68" height="68" rx="10" fill="${c.bone}"/>
  <circle cx="256" cy="256" r="36" fill="${c.bone}"/>
  <circle cx="356" cy="156" r="70" fill="${c.torch}" fill-opacity="0.2"/>
  <rect x="322" y="122" width="68" height="68" rx="8" transform="rotate(45 356 156)" fill="${c.torch}"/>
</svg>
`;
}

async function png(svg: string, size: number, out: string) {
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(out);
  console.log(`  ${path.relative(ROOT, out)} (${size}px)`);
}

async function main() {
  const colors = await readTokens();
  const rounded = iconSvg(colors, { rounded: true });
  const fullBleed = iconSvg(colors, { rounded: false });

  console.log("아이콘을 만들었어요:");
  await writeFile(path.join(ROOT, "src/app/icon.svg"), rounded);
  console.log("  src/app/icon.svg");
  await png(fullBleed, 180, path.join(ROOT, "src/app/apple-icon.png"));
  await png(rounded, 192, path.join(ROOT, "public/icons/icon-192.png"));
  await png(rounded, 512, path.join(ROOT, "public/icons/icon-512.png"));
  await png(fullBleed, 512, path.join(ROOT, "public/icons/maskable-512.png"));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
