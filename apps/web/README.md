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

동아리의 공개 정보를 구조화한 JSON 문자열로 임베딩합니다. 기존 네 소개 컬럼에
별도 가중치를 주지 않고 Article, 분류·소속, 활동 조건, SNS·이미지 주소, 최신 모집의
전체 내용·지원 조건·회비, 정기 모임, 후기 키워드별 집계까지 포함합니다.
식별자, 내부 심사 기록, 후기 작성자 정보는 제외합니다. 이미지 주소의 실제 이미지나
외부 링크 내용을 가져오지는 않습니다. 모집 기간·회비 등의 정확한 조건은 기존 SQL 필터로 판단합니다.

HTML과 빈 값을 정리하고 키·배열 순서를 고정해 같은 정보는 같은 해시가 되게 합니다.
`text-embedding-3-large`에 `dimensions: 1536`을 지정해 기존 벡터 컬럼을 사용합니다.
8191토큰을 넘는 문서는 모든 조각을 임베딩한 뒤 토큰 수로 가중 평균하고 정규화합니다.
긴 문서도 버리지 않고
기존 컬럼에 저장하지만, 여러 주제가 섞이면 개별 주제의 검색 신호가 약해질 수 있습니다.

모델·차원·입력 버전(`text-embedding-3-large:1536:v2`)과 문서 전체 해시로 갱신 대상을 판단합니다.
생성 중 원문이나 연관 정보가 바뀌면 저장을 건너뜁니다. 수정 사항은 다음 수동 갱신에서 반영됩니다.
모델이 바뀌면 **검색 정보 갱신**으로 전체 동아리를 재생성해야 합니다. 이전 `small` 벡터는
새 검색어 벡터와 비교하지 않습니다. 재생성 전에는 문자열 검색을 제공하고, 생성된 동아리부터
의미 검색에 포함합니다. 현재 유사도 기준 0.25는 새 모델의 결과를 확인하며 다시 조정할 수 있습니다.

갱신은 관리자 전용 `GET/POST /api/v2/admin/clubs/embeddings`로 20개씩 처리합니다.
화면을 닫아도 저장된 배치는 유지됩니다. 다시 실행하면 남은 변경분을 처리합니다.
검색어 벡터는 서버 프로세스별로 최대 500개, 24시간 캐시합니다. API 오류 시에는
문자열 검색을 제공합니다. API 요청 중에 DB 스키마를 변경하거나 자동 배치를 실행하지 않습니다.

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


