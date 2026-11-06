/**
 * 한국어 조사 고르기. 레슨 제목은 작성자가 정하므로 "을/를", "은/는"을 미리 정할 수 없다.
 * 한글 글자는 유니코드 안에 받침 정보가 들어 있어서 계산으로 알 수 있다.
 */

type JosaPair = "을/를" | "은/는" | "이/가" | "과/와";

// 숫자를 한국어로 읽을 때 받침이 있는지: 0영 1일 2이 3삼 4사 5오 6육 7칠 8팔 9구
const DIGIT_HAS_FINAL = [true, true, false, true, false, false, true, true, true, false];

/** 마지막 글자에 받침이 있으면 true, 없으면 false, 알 수 없으면(영어 등) null. 끝의 ?!」) 같은 기호는 건너뛴다 */
export function hasFinalConsonant(word: string): boolean | null {
  const chars = [...word.trim()];
  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i];
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
    if (/[0-9]/.test(ch)) return DIGIT_HAS_FINAL[Number(ch)];
    if (/[A-Za-z]/.test(ch)) return null;
  }
  return null;
}

/** josa("뭘 할까?", "은/는") → "는" / 알 수 없으면 "은(는)" */
export function josa(word: string, pair: JosaPair): string {
  const [withFinal, withoutFinal] = pair.split("/");
  const final = hasFinalConsonant(word);
  if (final === null) return `${withFinal}(${withoutFinal})`;
  return final ? withFinal : withoutFinal;
}
