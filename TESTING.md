# Testing Strategy

This document outlines the testing approach for the PO Project.

## Test Structure

```
tests/
├── unit/
│   ├── schemas.test.ts
│   ├── utils.test.ts
│   └── export-csv.test.ts
├── integration/
│   ├── api/
│   │   └── submissions.test.ts
│   └── flows/
│       └── submission-flow.test.ts
└── e2e/
    └── submission.e2e.ts
```

## Running Tests

```bash
# Install testing framework (if not already installed)
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @types/jest

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- schemas.test.ts

# Generate coverage report
npm test -- --coverage
```

## Unit Tests

### Schemas (`lib/schemas.ts`)

Test Zod schema validation:

```typescript
import { formDataSchema } from '@/lib/schemas'

describe('formDataSchema', () => {
  it('validates correct form data', () => {
    const valid = {
      field_name: 'John Doe',
      week_id: '123',
      status: 'submitted',
    }
    expect(() => formDataSchema.parse(valid)).not.toThrow()
  })

  it('rejects invalid data', () => {
    const invalid = { field_name: '' }
    expect(() => formDataSchema.parse(invalid)).toThrow()
  })
})
```

### Utils (`lib/utils.ts`)

Test utility functions:

```typescript
import { classNames } from '@/lib/utils'

describe('classNames', () => {
  it('merges class names correctly', () => {
    expect(classNames('px-2', 'py-1')).toBe('px-2 py-1')
    expect(classNames('px-2', { 'bg-red': true })).toContain('bg-red')
  })
})
```

### Export Functions (`lib/export-csv.ts`, `lib/export-docx.ts`)

```typescript
import { generateCSV } from '@/lib/export-csv'

describe('generateCSV', () => {
  it('generates valid CSV format', () => {
    const data = [{ id: '1', name: 'Test' }]
    const csv = generateCSV(data)
    expect(csv).toContain('id,name')
  })
})
```

## Integration Tests

### API Routes

Test API endpoints with mock Supabase:

```typescript
import { GET } from '@/app/api/submissions/route'

describe('GET /api/submissions', () => {
  it('returns submissions for authenticated user', async () => {
    const request = new Request('http://localhost:3000/api/submissions')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })

  it('returns 401 for unauthenticated request', async () => {
    // Mock no auth
    const response = await GET(new Request(...))
    expect(response.status).toBe(401)
  })
})
```

## Component Tests

Test React components:

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByText('Click').click()
    expect(handleClick).toHaveBeenCalled()
  })
})
```

## E2E Tests (Playwright recommended)

```bash
npm install --save-dev @playwright/test
```

Example E2E test:

```typescript
import { test, expect } from '@playwright/test'

test('complete submission flow', async ({ page }) => {
  await page.goto('http://localhost:3000/submit')
  
  // Fill form
  await page.fill('input[name="field_name"]', 'Test Field')
  await page.click('button:has-text("Next")')
  
  // Verify redirect
  await expect(page).toHaveURL('/submit?step=2')
})
```

## Test Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

## Coverage Goals

- **Lines**: ≥ 80%
- **Branches**: ≥ 75%
- **Functions**: ≥ 80%
- **Statements**: ≥ 80%

Generate coverage:

```bash
npm test -- --coverage
```

View report:

```bash
open coverage/lcov-report/index.html
```

## CI/CD Integration

Tests run on every PR via GitHub Actions (see `.github/workflows/ci-cd.yml`).

## Testing Best Practices

1. **Isolation**: Each test independent, no side effects
2. **Descriptive**: Clear test names explaining what's tested
3. **Arrange-Act-Assert**: Structure each test with these phases
4. **Mock External**: Don't hit real Supabase/APIs in tests
5. **Async Handling**: Properly await async operations
6. **Error Cases**: Test success AND failure paths

---

Last Updated: 2026-03-20
