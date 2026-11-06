/** 사이트 이름·설명·바탕색. 공통 틀(layout)과 홈 화면 앱 정보(manifest)가 함께 쓴다 */
export const SITE = {
  name: "정글 교과서",
  description: "정글을 처음 해보는 플레이어를 위한 레슨과 상황 퀴즈",
  /**
   * 휴대폰 상단 막대와 앱 시작 화면의 색. globals.css의 --color-night 와 같아야 한다
   * (어긋나면 site.test.ts가 실패한다)
   */
  backgroundColor: "#0e2420",
} as const;
