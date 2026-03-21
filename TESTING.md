# Testing Strategy

This document outlines the active test setup for the PO Project.

## Active Test Stack

- Unit tests: Vitest
- Coverage: V8 coverage via `@vitest/coverage-v8`
- Current test location: `tests/unit/`

## Test Structure

```
tests/
└── unit/
  ├── schemas.test.ts
  ├── rate-limit.test.ts
  └── name-format.test.ts
```

## Running Tests

```bash
# Run all unit tests once
npm run test

# Run in watch mode
npm run test:watch

# Run coverage
npm run coverage

# Run lint + typecheck + tests (recommended before PR)
npm run lint
npm run typecheck
npm run test
```

## What Is Currently Covered

1. Schema validation for full submissions and drafts
2. Rate limiter allow/deny behavior
3. Name normalization utility correctness

## Next Coverage Targets

1. API integration tests for `/api/submit`, `/api/draft`, `/api/submissions/[id]/approve`
2. Middleware auth-routing tests (admin vs field_staff)
3. RLS behavior tests in Supabase test environment
4. End-to-end submission and admin approval flow

## Test Configuration

Vitest configuration lives in `vitest.config.ts` and uses:

- Node test environment
- `@/` path alias resolution
- V8 coverage output in `/coverage`

## Coverage Goals

- **Current policy**: Coverage is reported but not enforced as a CI gate yet.
- **Targets** (team goal):
  - Lines: ≥ 80%
  - Branches: ≥ 75%
  - Functions: ≥ 80%
  - Statements: ≥ 80%

Generate coverage:

```bash
npm test -- --coverage
```

View report:

```bash
open coverage/lcov-report/index.html
```

## CI/CD Integration

Unit tests and typecheck run in CI for every PR and protected-branch push via `.github/workflows/ci-cd.yml`.

## Testing Best Practices

1. **Isolation**: Each test independent, no side effects
2. **Descriptive**: Clear test names explaining what's tested
3. **Arrange-Act-Assert**: Structure each test with these phases
4. **Mock External**: Don't hit real Supabase/APIs in tests
5. **Async Handling**: Properly await async operations
6. **Error Cases**: Test success AND failure paths

---

Last Updated: 2026-03-20
