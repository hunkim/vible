# Vible · 비주얼 바이블

말씀을 읽다, 장면을 만나다.

요한복음 전권 **21장 · 879절 · 196개 맥락 장면**을 담은 웹앱입니다. 본문을 읽어 내려가면 그림이 맥락에 맞춰 바뀝니다. 1장부터 21장까지 하나의 연속 스크롤로 이어지며, 장 사이에 클릭이 필요하지 않습니다. 본문은 그림 위에 오버레이됩니다. 전체 흐름, 장면 지도와 검색, 글자 크기 변경, 그림 몰입 모드, 모바일 읽기와 읽던 위치 저장을 지원합니다.

## Vercel 배포

1. Vercel에서 **Add New → Project**를 선택합니다.
2. GitHub의 **hunkim/vible**을 Import합니다.
3. Root Directory는 저장소 루트(`./`)로 둡니다.
4. Deploy를 누릅니다.

`vercel.json`에 Framework: Other, Build Command: `npm run build`, Output Directory: `dist`를 설정했습니다. 별도 환경변수나 API 키가 필요하지 않습니다. 빌드에는 외부 패키지 설치가 필요하지 않습니다. 설정 설명: https://vercel.com/docs/project-configuration

## 로컬 실행

```sh
npm run dev
```

http://127.0.0.1:4174/ 에서 엽니다.

```sh
npm run check
python3 check.py
node check-http.mjs
```

`check.py`에는 Python Pillow가 필요합니다. 빌드는 Node.js 기본 라이브러리만 사용합니다. 빌드는 원본 본문과 절 번호의 일치, 21장 범위, 196개 그림 파일을 확인한 뒤 실제 사용하는 그림만 `dist/`에 담습니다.

## 본문과 그림

성경전서 개역한글판 © 대한성서공회 1961.

- 전자 본문 데이터: https://github.com/yuhwan/Bible-krv
- 본문 대조: https://www.bible.com/ko/bible/88/JHN.1.KRV
- 역본 사용 안내: https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5
- 구조 참고: https://bibleproject.com/guides/book-of-john/

성경 본문은 원본 그대로 보존했습니다. 장면 구분과 제목은 편집 판단이며, 그림은 역사 사진이 아닌 시각적 해석입니다. 비유를 그린 장면은 앱의 설명에서 구분합니다. 5:3–4와 7:53–8:11의 괄호도 유지했습니다. 목회자나 성서학자의 장면별 최종 감수는 별도 단계입니다.

그림은 내장 image_gen으로 최대 10개씩 병렬 생성했습니다. 자연광과 대형 포맷 역사 영화 톤을 사용하며 그림 안에는 장식 글씨를 넣지 않았습니다. `image-plan.json`은 전체 프롬프트, `continuity-edits.json`은 8개 장면 수정 기록, `image-overrides.json`은 최종 그림 선택을 보존합니다. 생성 원본의 개인 컴퓨터 경로는 포함하지 않습니다.

`python3 build-data.py`로 본문과 기획을 다시 만들 수 있습니다. `?preview=1`은 확인 중 읽던 위치 저장을 바꾸지 않습니다.

