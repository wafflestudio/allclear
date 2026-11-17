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

`/api/v2/clubs/ai-search`는 검색문에서 모든 동아리에 흔한 낱말을 빼고, 문자열 검색 결과 뒤에 뜻이 가까운 동아리를 붙입니다.
회원 전용이며 계정당 하루 50회까지 쓸 수 있습니다.

1. migration을 적용합니다. `pnpm --dir apps/web exec prisma migrate deploy`
2. 서버 환경 변수 `ELICE_KEY`, `ELICE_EMBEDDING_ENDPOINT`를 설정합니다.
   값의 형식은 `.env.example`에 있습니다. 설정이 없으면 문자열 검색만 합니다.
3. `/admin`의 **검색 정보 갱신**에서 동아리 임베딩을 만듭니다. 이후 월 1회 갱신합니다.

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


