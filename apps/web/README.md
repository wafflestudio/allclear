# 올클 Web Application

<img src="https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=Typescript&logoColor=white"/></a>
<img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=React&logoColor=white"/></a>
<img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=Next.js&logoColor=white"/></a>
<img src="https://img.shields.io/badge/React Query-FF4154?style=flat-square&logo=React Query&logoColor=white"/></a>
<img src="https://img.shields.io/badge/Zustand-764ABC?style=flat-square&logo=Redux&logoColor=white"/></a>

<img src="https://img.shields.io/badge/Tailwind CSS-06B6D4?style=flat-square&logo=Tailwind CSS&logoColor=white"/></a>
<img src="https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=ESLint&logoColor=white"/></a>
<img src="https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=Prettier&logoColor=white"/></a>

## 처음 프로젝트 환경 셋업하기

```Bash
git clone https://github.com/pado-corp/clubhouse-web.git
cd clubhouse-web
pnpm install
pnpm husky install
pnpm dev
```

## 의미 검색

1. DB에 `sql/261109_club_semantic_search.sql`을 실행합니다.
2. 서버 환경 변수 `OPEN_AI_KEY`를 설정합니다. 로컬은 `.env.local`을 사용합니다.
3. `/admin`의 **검색 정보 갱신** 버튼에서 최초 생성 후 월 1회 갱신합니다.

사용자 검색은 기존 `/api/v2/clubs/search?query=컴공`을 사용합니다. 문자열 일치 결과
뒤에 의미 검색 결과를 거리순으로 추가하며, 기존 필터와 응답 형식을 유지합니다.

`name`, `short_description`, `description`, `introduction`을 합쳐 공백과 HTML 태그를
정리한 뒤 `text-embedding-3-small`의 1536차원 벡터로 저장합니다. 입력은 최대
7000 UTF-8 바이트로 제한됩니다. 변경 없는 동아리는 건너뛰며, 생성 중 원문이
바뀌면 저장하지 않습니다. 수정된 소개는 다음 수동 갱신까지 이전 벡터로 검색됩니다.

갱신은 관리자 전용 `GET/POST /api/v2/admin/clubs/embeddings`로 20개씩 처리합니다.
화면을 닫아도 저장된 배치는 유지됩니다. 다시 실행하면 남은 변경분을 처리합니다.
검색어 벡터는 서버 프로세스별로 최대 500개, 24시간 캐시합니다. API 오류 시에는
문자열 검색을 제공합니다. DB 스키마를 자동으로 변경하거나 자동 배치를 실행하지 않습니다.

검색 결과는 [실행 노트북](notebooks/semantic-search.ipynb)에서 확인할 수 있습니다.

## 기술 스택

### 언어 / 프레임워크
- Typescript
- React.js
- Next.js

### 상태 관리 / API 호출
- Axios
- Tanstack Query
- Zustand

### 스타일링
- Tailwind CSS
- Flowbite

### 포맷팅 / 배포
- ESLint
- Prettier
- Husky / Lint-Staged
- AWS Route53
- Vercel

## 배포 방식
- github에 푸시하면 vercel에 자동 배포

## 코드 컨벤션

### 페이지

- {root directory}/pages 폴더 내에 생성합니다.
- NextPage 타입을 활용합니다.
- 레이아웃을 사용하지 않거나 커스터마이징하고 싶은 경우, page에 getLayout 속성을 제공합니다.
- 페이지를 추가·수정·삭제할 때 내부 링크와 `next.config.js`의 리다이렉트·리라이트도
  함께 확인합니다.


