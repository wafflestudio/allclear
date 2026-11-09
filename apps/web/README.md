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
git clone https://github.com/wafflestudio/allclear.git
cd allclear
pnpm install
pnpm --dir apps/web prisma:generate
pnpm dev:web
```

위 명령은 저장소 루트에서 실행합니다. 이후에는 Prisma 스키마가 바뀌거나
`node_modules`를 다시 설치한 경우에만 `prisma:generate`를 다시 실행하면 됩니다.
`pnpm dev:web`은 DB migration을 실행하지 않습니다.

## 의미 검색

1. Prisma migration `20261109143000_club_semantic_search`를 적용합니다.
2. 서버 환경 변수 `OPEN_AI_KEY`를 설정합니다. 로컬은 `.env.local`을 사용합니다.
3. `/admin`의 **검색 정보 갱신** 버튼에서 최초 생성 후 월 1회 갱신합니다.

`schema.prisma`의 `club`에 `embedding`, `embedding_model`, `embedding_source_hash`,
`embedding_updated_at`을 선언합니다. `vector(1536)`은 `Unsupported` 타입으로 관리하고,
벡터 저장·거리 계산은 Prisma의 파라미터 바인딩된 `$executeRaw` / `$queryRaw`로 실행합니다.
일반 조회와 검색 필터는 Prisma Client를 사용합니다.

DB 변경은 저장소 루트에서 `pnpm --dir apps/web exec prisma migrate deploy`로 적용합니다.
기존 DB는 develop의 `0_init` baseline이 등록되어 있어야 합니다. 운영 배포는 기존
Prisma PreSync 작업이 migration을 실행합니다. 개발 배포에는 자동 migration이 없으므로
개발 DB에도 새 앱 배포 전에 적용해야 합니다. `prisma:generate`는 Client 코드만 생성하며
DB를 변경하지 않습니다. 과거 수동 SQL로 네 컬럼을 만든 DB도 이번 migration을 적용할 수 있습니다.

사용자 검색은 기존 `/api/v2/clubs/search?query=컴공`을 사용합니다. 문자열 일치 결과
뒤에 의미 검색 결과를 거리순으로 추가하며, 기존 필터와 응답 형식을 유지합니다.

갱신 코드는 다음 순서로 읽으면 됩니다.

| 단계 | 코드 | 역할 |
| --- | --- | --- |
| 조회 | [embedding-source.ts](server/service/search/embedding-source.ts) | 공개 동아리 정보·소속·최신 모집과 정기 모임·후기 집계 선택 |
| 문서 | [embedding-document.ts](server/service/search/embedding-document.ts) | HTML·빈 값·배열 순서를 정리하고 입력 텍스트와 해시 생성 |
| 임베딩 | [embedding.ts](server/service/search/embedding.ts) | 토큰 분할 → API 호출 → 문서별 가중 합산·정규화 |
| 저장 | [embedding-update.service.ts](server/service/search/embedding-update.service.ts) | 변경된 문서만 생성하고 저장 직전에 원문 재확인 |

문서는 공개 소개·Article·분류·활동 조건·SNS 및 이미지 주소를 포함합니다. 링크나 이미지의
내용은 가져오지 않으며, 식별자·내부 심사 기록·후기 작성자는 제외합니다. 모집 기간·회비 같은
정확한 조건은 SQL 필터로 판단합니다.

모델은 `text-embedding-3-large`, 차원은 1536, 입력 버전은 `v2`입니다. 8191토큰을 넘으면
모든 조각을 길이로 가중 합산해 단위 벡터로 만듭니다. 여러 주제를 하나의 벡터에 담으므로
개별 주제의 검색 신호는 약해질 수 있습니다. 의미 검색의 유사도 기준은 0.25입니다.

관리자 API `GET/POST /api/v2/admin/clubs/embeddings`가 20개씩 처리합니다. 모델·입력 버전이나
문서 해시가 달라진 동아리를 갱신하며, 저장 전 재조회에서 원문 변경이 확인되면 건너뜁니다.
중단 후 다시 실행해도 저장된 배치는 유지됩니다. 이전 `small` 벡터는 사용하지 않으므로
모델 변경 후에는 전체를 재생성해야 합니다.

검색어 벡터는 최대 500개, 24시간 캐시합니다. API 오류 시에는 문자열 검색을 제공합니다.
앱은 DB 스키마를 변경하거나 갱신 배치를 자동 실행하지 않습니다.

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


