# 정글 교과서

정글을 처음 해보는 롤 플레이어를 위한 레슨 + 상황 퀴즈 웹 강좌. 기획: [docs/spec.md](docs/spec.md)

## 실행

```bash
npm install      # 처음 한 번
npm run dev      # http://localhost:3000 에서 보기
npm run check    # 린트 + 타입 검사 + 테스트
npm run build    # out/ 폴더에 정적 사이트 만들기
```

## 레슨 추가

`content/_template/` 폴더를 `content/lessons/<번호-영어이름>/`으로 복사하고 내용을 채운 뒤 `npm run check`로 양식을 점검한다. (1단계에서 추가 예정)
