# AGENTS.md — allclear-app

React Native app (iOS + Android) for the Allclear club discovery service.

## Commands

```bash
# Dev
yarn start                          # Metro bundler
yarn ios:local                      # iOS (local env)
yarn ios:prod                       # iOS (prod env)
yarn android:debug                  # Android debug (local env)
yarn android:release                # Android release (prod env)

# Quality
yarn lint                           # ESLint
yarn tsc --noEmit                   # Type check (also runs on pre-push)

# Build
yarn build:android:debug            # Android APK (debug)
yarn build:android:release          # Android bundle (release)
yarn build:ios:prod:release         # iOS release build

# Maintenance
yarn re-install                     # Clean reinstall node_modules
yarn android:clean                  # Clean Android build artifacts
```

## Project Structure

```
src/
├── assets/          # Images and icons
├── config/          # ENV.ts — typed env variables
├── entities/        # Domain types (club, user, category, review, …)
├── repositories/    # Data layer — axios calls via APIConnector
├── usecases/        # Business logic, composed from repositories
├── features/        # Feature modules (club, home, mypage, search, webview)
│   └── <feature>/
│       ├── components/
│       ├── screens/
│       └── hooks/
├── shared/          # Cross-feature code
│   ├── components/  # Reusable UI components
│   ├── constants/   # colors, typography, screen names, localStorage keys
│   ├── contexts/    # React contexts (profile, login sheet, manage club, …)
│   ├── hooks/       # Shared hooks
│   └── utils/       # api.ts, navigation.ts, scale.ts
└── tabs/            # Tab navigator and tab-level screens
```

Path alias: `@/` → `src/`

## Architecture

- **Layer order**: `entities` → `repositories` → `usecases` → `features` / `shared`
- Upper layers must not import from lower layers in reverse.
- API calls go through `APIConnector` in `src/shared/utils/api.ts`. Do not use axios directly in features.
- Server state is managed with React Query v4 (`@tanstack/react-query`).
- Navigation uses React Navigation (native-stack + bottom-tabs).

## Code Style

- **Formatter**: Prettier — single quotes, no semicolons, trailing commas, tabs (width 2), printWidth 100, LF
- **Linter**: ESLint with TypeScript, React, React Hooks, React Native plugins
- Pre-commit hook runs `lint-staged` (prettier + eslint --fix on TS/TSX files automatically)
- Pre-push hook runs `yarn tsc --noEmit` — fix type errors before pushing

## TypeScript

- Strict mode enabled
- `@/` path alias available everywhere
- Avoid `any`; use `unknown` and narrow types properly
- `@typescript-eslint/no-unused-vars` warns on unused vars (prefix with `_` to suppress)

## Environment

- `.env.local` — local development
- `.env.prod` — production
- iOS schemes: `Local`, `clubhouse`
- Android build types: `debug` (local env), `release` (prod env)
- All env values accessed via `src/config/ENV.ts`; never read `process.env` directly

## Git Workflow

- Main branch: `develop`
- Branch naming: `<type>/<short-description>` (e.g. `feat/club-filter`, `fix/tab-inset`)
- PR template is in Korean — fill in 작업 내용, 변경 이유, 테스트한 내용, 스크린샷
- Do not push directly to `develop`

## Conventions

- Component files use PascalCase (`ClubPreviewCard.tsx`)
- Non-component files use camelCase (`useClickEventLog.ts`, `api.ts`)
- Each screen lives in its own directory: `screens/FooScreen/index.tsx`
- Shared UI components go in `src/shared/components/`
- Colors are defined in `src/shared/constants/colors.ts` — use `Colors.*` constants, not raw hex values
- Typography is in `src/shared/constants/typography.ts`
- Use `src/shared/utils/scale.ts` for responsive sizing

## Before Editing

- Check local changes (`git status`, `git diff`) first; don't overwrite user work.
- Confirm the correct layer (`entities` → `repositories` → `usecases` → `features` / `shared`).
- Prefer `rg` / `rg --files` for fast lookup when searching the codebase.
- Follow existing patterns; don't introduce a new structure without reason.

## After Editing

- Run `yarn tsc --noEmit` and `yarn lint`; fix all errors.
- Remove `console.log`, unused imports, and dead code.

## Do Not

- Do not commit `.env.local` or `.env.prod`
- Do not import from `node_modules` paths that bypass the layer architecture
- Do not add `console.log` to committed code
- Do not use inline styles when a `Colors` or `Typography` constant exists
