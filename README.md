# 김준현 — 연구 포트폴리오

**https://joonhyunkim1.github.io/portfolio/**

홍익대학교 전자전기공학과 석사과정 김준현의 연구 포트폴리오입니다.
Edge AI와 Computer Vision을 기반으로 한 산업 안전 모니터링 연구를 중심으로,
학술논문 · 참여 연구과제 · 개인/팀 프로젝트 · 활동 이력을 한 페이지에 정리했습니다.

빌드 과정이 없는 정적 페이지이며, GitHub Pages로 배포됩니다.

## 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 전체 내용 (연구 프로필 · 학술논문 · 연구과제 · 프로젝트 · 활동 · 취미 · 연락처) |
| `style.css` | 스타일. 맨 위 주석에 섹션 목차가 있고, 색은 `:root`의 변수로 관리합니다 |
| `script.js` | 스크롤 등장 효과, PDF 저장 버튼 |
| `travel.js` | 취미 섹션의 세계지도. 여행 기록은 파일 상단 `TRIPS` 배열에 있습니다 |
| `assets/profile.jpg` | 프로필 사진 |
| `assets/travel/` | 지도 핀에 쓰는 여행 사진 (240px 정사각형 썸네일) |

## 수정과 배포

내용은 `index.html`에서 고칩니다. 커밋을 `main`에 올리면 GitHub Pages가 1~2분 안에
다시 배포합니다.

```bash
git add .
git commit -m "수정 내용"
git push
```

`style.css`나 스크립트를 고쳤다면 `index.html`에 있는 주소 뒤 버전(`?v=…`)도 함께 올려야
방문자 브라우저가 예전 캐시 대신 새 파일을 받습니다.

새 여행을 추가할 때는 `assets/travel/`에 정사각형 사진을 넣고 `travel.js`의 `TRIPS`에
한 줄 추가하면 지도에 핀이 생깁니다.

## PDF로 저장

페이지 오른쪽 위 **PDF로 저장** 버튼을 누르면 인쇄 창이 열립니다.
대상에서 "PDF로 저장"을 고르면 되고, 인쇄용으로는 밝은 배경이 적용됩니다.

## 참고

- 이 저장소는 GitHub Pages로 사이트를 서비스하기 위해 공개 상태로 둡니다.
- 주소, 전화번호, 자격번호 등 공개에 부적합한 정보는 담지 않았습니다. 연락용 이메일은 의도적으로 공개했습니다.
- 지도는 [world-atlas](https://github.com/topojson/world-atlas)의 지도 데이터와 d3-geo를 사용합니다.
