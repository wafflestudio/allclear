# Allclear

Allclear 모바일 앱과 웹 서비스를 함께 관리하는 모노레포입니다.

## 구성

- `apps/mobile`: React Native 기반 iOS/Android 앱
- `apps/web`: Next.js 기반 웹 서비스

## 시작하기

Node.js 22.13 이상과 pnpm 11이 필요합니다.

```bash
pnpm install
```

```bash
pnpm start       # 모바일 개발 서버
pnpm dev:web     # 웹 개발 서버
pnpm ios:local   # iOS 로컬 앱
pnpm android:debug
```

환경 변수 파일은 저장소에 포함하지 않습니다. 각 앱의 `.env.example`을 복사해 로컬 환경에 맞게 설정하세요.

웹 서버는 Prisma Client로 PostgreSQL에 연결합니다. 의존성을 설치한 직후나
`apps/web/prisma/schema.prisma`를 변경한 뒤에는 저장소 루트에서
`pnpm --dir apps/web prisma:generate`를 실행하세요. 평소에는 생성된 Client가 있으면
`pnpm dev:web`만 실행하면 됩니다. 웹 빌드는 Client를 자동 생성하며, Client 생성은
DB 스키마를 변경하지 않습니다. DB 변경은 별도의 Prisma migration으로 관리합니다.

## 검사

```bash
pnpm verify
```

Turbo가 각 앱의 Biome 린트, 타입 검사와 테스트를 실행합니다.
