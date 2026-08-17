# AGENTS.md — allclear-app

React Native app (iOS + Android) for the Allclear club discovery service.

## Commands

```bash
# Dev
pnpm start                          # Metro bundler
pnpm ios:local                      # iOS (local env)
pnpm ios:prod                       # iOS (prod env)
pnpm android:debug                  # Android debug (local env)
pnpm android:release                # Android release (prod env)

# Quality
pnpm lint                           # Biome lint
pnpm typecheck                      # TypeScript check (also runs on pre-push)
pnpm test --runInBand               # Jest test suite
pnpm verify                         # Biome + typecheck + tests
pnpm verify:full                    # verify + Android and iOS bundle checks

# Build
pnpm build:android:debug            # Android APK (debug)
pnpm build:android:release          # Android bundle (release)
pnpm build:ios:prod:release         # iOS release build

# Maintenance
pnpm re-install                     # Clean reinstall node_modules
pnpm android:clean                  # Clean Android build artifacts
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

- **Formatter and linter**: Biome defaults with recommended lint, React, and test rules
- Run `pnpm fix` followed by `pnpm verify` before committing
- `pnpm fix` applies safe Biome formatting and lint fixes; `pnpm verify` is read-only
- Pre-commit hook runs `lint-staged` (`biome check --write` on supported staged files)
- Pre-push hook runs `pnpm verify` — fix formatting, lint, type, or test failures before pushing

## TypeScript

- Strict mode enabled
- `@/` path alias available everywhere
- Avoid `any`; use `unknown` and narrow types properly
- Biome warns on unused variables and parameters (prefix intentionally unused parameters with `_`)

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

- Run `pnpm fix`, then `pnpm verify`, and resolve any remaining errors before handing work back.
- Run `pnpm verify:full` when changes affect dependencies, build configuration, bundling, native integration, or release behavior.
- Remove `console.log`, unused imports, and dead code.

## Do Not

- Do not commit `.env.local` or `.env.prod`
- Do not import from `node_modules` paths that bypass the layer architecture
- Do not add `console.log` to committed code
- Do not use inline styles when a `Colors` or `Typography` constant exists
