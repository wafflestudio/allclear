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

## AI 검색

1. Prisma migration `20261109143000_club_semantic_search`와
   `20261110000000_club_embedding_3072`를 순서대로 적용합니다.
2. 서버 환경 변수 `OPEN_AI_KEY`를 설정합니다. 로컬은 `.env.local`을 사용합니다.
3. `/admin`의 **검색 정보 갱신** 버튼에서 최초 생성 후 월 1회 갱신합니다.

`schema.prisma`의 `club`에 `embedding`, `embedding_model`, `embedding_source_hash`,
`embedding_updated_at`을 선언합니다. `vector(3072)`는 `Unsupported` 타입으로 관리하고,
벡터 저장·거리 계산은 Prisma의 파라미터 바인딩된 `$executeRaw` / `$queryRaw`로 실행합니다.
일반 조회와 검색 필터는 Prisma Client를 사용합니다.

DB 변경은 저장소 루트에서 `pnpm --dir apps/web exec prisma migrate deploy`로 적용합니다.
기존 DB는 develop의 `0_init` baseline이 등록되어 있어야 합니다. 운영 배포는 기존
Prisma PreSync 작업이 migration을 실행합니다. 개발 배포에는 자동 migration이 없으므로
개발 DB에도 새 앱 배포 전에 적용해야 합니다. `prisma:generate`는 Client 코드만 생성하며
DB를 변경하지 않습니다. 과거 수동 SQL로 네 컬럼을 만든 DB도 이번 migration을 적용할 수 있습니다.

### 1536 → 3072차원 전환

기존 migration은 수정하지 않고 `20261110000000_club_embedding_3072`를 추가했습니다.
새 migration은 `club.embedding`을 `vector(3072)`로 바꾸면서 기존 벡터와 모델·문서 해시·
갱신 시각을 NULL로 초기화합니다. 동아리 원문은 유지됩니다. 기존 1536차원 벡터를
3072차원으로 복원할 수 없으므로 API로 전체 임베딩을 다시 생성해야 합니다.

1. 실행 중인 관리자 임베딩 갱신을 완료하거나 중지합니다.
2. 아래 명령을 저장소 루트에서 실행합니다. `prisma.config.ts`가 읽는
   `apps/web/.env.local` 또는 실행 환경의 `DB_HOST`, `DB_PORT`, `DB_USERNAME`,
   `DB_PASSWORD`, `DB_NAME`이 적용할 DB를 가리키는지 확인합니다.

   ```bash
   pnpm --dir apps/web prisma:validate
   pnpm --dir apps/web exec prisma migrate status
   pnpm --dir apps/web exec prisma migrate deploy
   pnpm --dir apps/web prisma:generate
   ```

3. 새 앱을 배포하거나 로컬 서버를 재시작합니다. 이때 검색어 임베딩 캐시도 초기화됩니다.
4. `/admin`의 **검색 정보 갱신**을 실행해 전체 임베딩을 재생성합니다.
   재생성이 끝나기 전에는 아직 처리되지 않은 동아리가 의미 검색 결과에 포함되지 않습니다.
   문자열 검색은 계속 사용할 수 있습니다.

이번 변경의 SQL은 이미 작성되어 있으므로 별도 `migrate dev` 실행은 필요하지 않습니다.
이후 새로운 스키마 변경을 작성할 때는 개발 DB에서 `prisma migrate dev --create-only --name ...`로
초안을 만들고 필요한 SQL을 편집합니다. 이 프로젝트의 Prisma 7 기준
[사용자 정의 migration 문서](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/customizing-migrations)를 참고합니다.

현재 의미 검색은 벡터 인덱스 없이 코사인 거리를 계산합니다. `vector(3072)` 저장과 거리 계산은
가능하지만, `vector`의 HNSW/IVFFlat 인덱스는 최대 2000차원이므로 향후 인덱스를 추가할 때는
`halfvec(3072)` 표현식 인덱스 등 별도 설계가 필요합니다. [pgvector 문서](https://github.com/pgvector/pgvector#what-if-i-want-to-index-vectors-with-more-than-2000-dimensions)

### 검색 API와 갱신 동작

| API | 동작 |
| --- | --- |
| `GET /api/v2/clubs/search?query=컴공` | 기존 문자열 검색과 오타 교정. AI 호출 없음 |
| `GET /api/v2/clubs/ai-search?query=개발하기 좋은 동아리` | 검색문 전처리 후 문자열 검색과 의미 검색 |
| `GET /api/v2/clubs/ai-search/intent?query=회비 없는 개발 동아리` | 전처리 JSON만 확인 |

모든 API는 유효한 bearer token 또는 `x-guest-id` UUID 헤더가 필요하며, 검색문은
1~200자입니다. 두 검색 API는 필터·응답 형식·최근 검색어 저장 규칙을 공유합니다.
AI 검색은 문자열 일치 결과 뒤에 의미 검색 결과를 유사도순으로 추가합니다.
웹과 앱의 기존 검색은 `/search`를 사용하며, AI 검색은 `/ai-search`로 별도 요청합니다.

모든 AI 검색문은 길이나 공백 유무와 관계없이 두 단계로 해석합니다.

| 순서 | 역할 | 코드 |
| --- | --- | --- |
| 1 | Perplexity Decider가 명시적 조건을 `filters`로 선택 | [search-filter-intent.ts](server/service/search/search-filter-intent.ts) |
| 2 | DeepSeek가 적용된 조건을 빼고 `searchQuery` 생성 | [search-query-intent.ts](server/service/search/search-query-intent.ts) |

서버 환경 변수는 `PERPLEXITY_KEY`, `DEEPSEEK_KEY`입니다. Decider는 `pplx-decider-v1.2`로
7개 필터를 한 번에 판정하며, `none` 또는 신뢰도 0.85 미만인 선택은 적용하지 않습니다.
DeepSeek는 `deepseek-flash`의 비추론·JSON 모드로 검색 문구만 만듭니다.
확정된 필터를 먼저 전달하므로, 지원하지 않거나 판정하지 못한 조건은 검색문에 남깁니다.
예를 들어 `회비 없는 개발 동아리`는 `소프트웨어 개발`과 `hasMembershipFee: false`가 됩니다.
`INTP한테 어울리는 동아리` 같은 취향은 검색어에 남기며 DB 조건으로 추측하지 않습니다.

[search-intent.ts](server/service/search/search-intent.ts)가 전체 흐름을 관리합니다.
두 단계 합계 3초 제한, 최대 500개·24시간 캐시, 동시 요청 공유를 적용합니다.
Decider 키가 없거나 실패하면 빈 필터로, DeepSeek 키가 없거나 실패하면 원문으로 진행합니다.
실패한 결과는 캐시하지 않습니다. 한 글자·한 단어 검색도 같은 전처리를 거칩니다.
URL 필터가 우선하며, 응답·검색 기록의 `query`는 원문을 유지합니다.

[Decisions API](https://docs.perplexity.ai/docs/decisions/quickstart) ·
[DeepSeek JSON 출력](https://api-docs.deepseek.com/guides/json_mode/)

`/ai-search/intent`도 같은 전처리 함수를 사용하며, 검색·임베딩·검색 기록 저장은 실행하지 않습니다.
예를 들어 `회비 없는 개발 동아리`의 응답은 다음과 같습니다.

```json
{
  "searchQuery": "소프트웨어 개발",
  "filters": { "hasMembershipFee": false }
}
```

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

모델은 `text-embedding-3-large`, 차원은 기본값인 3072, 입력 버전은 `v2`입니다.
[OpenAI 공식 임베딩 문서](https://developers.openai.com/api/docs/guides/embeddings)

8191토큰을 넘으면 모든 조각을 길이로 가중 합산해 단위 벡터로 만듭니다. 여러 주제를 하나의 벡터에 담으므로
개별 주제의 검색 신호는 약해질 수 있습니다. 의미 검색의 유사도 기준은 0.24입니다.

관리자 API `GET/POST /api/v2/admin/clubs/embeddings`가 20개씩 처리합니다. 모델·입력 버전이나
문서 해시가 달라진 동아리를 갱신하며, 저장 전 재조회에서 원문 변경이 확인되면 건너뜁니다.
중단 후 다시 실행해도 저장된 배치는 유지됩니다. `text-embedding-3-large:3072:v2`와 일치하는
벡터만 검색에 사용하므로 모델이나 차원을 변경한 후에는 전체를 재생성해야 합니다.

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


