import { describe, expect, it } from "vitest";
import { hasFinalConsonant, josa } from "./korean";

describe("josa", () => {
  it("받침 없는 글자 뒤에는 를/는", () => {
    expect(josa("어디서 시작해서 어떤 순서로 돌까?", "을/를")).toBe("를");
    expect(josa("지금 갱, 파밍, 오브젝트 중 뭘 할까?", "은/는")).toBe("는");
  });

  it("받침 있는 글자 뒤에는 을/은", () => {
    expect(josa("적 정글러 위치 판단", "을/를")).toBe("을"); // 단
    expect(josa("첫 클리어 동선", "이/가")).toBe("이"); // 선
    expect(josa("갱 각", "은/는")).toBe("은");
  });

  it("끝의 기호는 건너뛰고, 숫자는 읽는 소리로 판단한다", () => {
    expect(hasFinalConsonant("레슨 1」")).toBe(true); // 일
    expect(hasFinalConsonant("레슨 2")).toBe(false); // 이
  });

  it("영어로 끝나면 둘 다 보여 준다", () => {
    expect(josa("Smite", "을/를")).toBe("을(를)");
  });
});
