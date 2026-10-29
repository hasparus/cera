- Bun, not npm/pnpm/yarn. `bunx` not `npx`.
- E2E tests = whole user flows, not simple checks.
- `useReducer`, not `useState` (oxlint enforces it).

## Commands

`bun start-web`, `bun start`, `bun typecheck`, `bun lint`, `bun oxlint`, `bun run test` (Playwright e2e).

`hk install` once → pre-commit hooks (prettier, eslint, oxlint, typecheck; see `hk.pkl`).

## Convex

Backend = [Convex](https://convex.dev). Before Convex work, read
`convex/_generated/ai/guidelines.md` — rules there override training data.
