# 정글 교과서

정글을 처음 해보는 롤 플레이어를 위한 레슨 + 상황 퀴즈 웹 강좌. 기획: [docs/spec.md](docs/spec.md)

## 실행

```bash
npm install            # 처음 한 번
npm run dev            # http://localhost:3000 에서 보기
npm run check:lessons  # 레슨 양식만 점검
npm run check          # 린트 + 타입 검사 + 레슨 점검 + 테스트
npm run build          # out/ 폴더에 정적 사이트 만들기 (레슨 오류가 있으면 멈춤)
```

## 레슨 추가

1. `content/_template/` 폴더를 복사해 `content/lessons/04-영어-이름/`으로 넣는다 (폴더 이름이 주소가 된다)
2. `lesson.md` 머리말과 본문, `quiz.yaml`을 채운다. 파일 안의 `#` 설명을 따라가면 된다
3. 이미지는 레슨 폴더의 `images/`에 넣고 본문에 `![설명](./images/파일이름.png)`으로 적는다
4. `npm run check:lessons`로 점검한다. 오류가 나오면 메시지에 적힌 파일과 칸을 고친다
5. 다 채웠으면 머리말의 `status`를 `공개`로 바꾼다

자주 나는 실수: 값 안에 `: `(콜론+띄어쓰기)를 넣으면 YAML 오류가 난다. 그럴 땐 값 전체를 `"따옴표"`로 감싼다.
