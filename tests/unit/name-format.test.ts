import { normalizeFullName } from '@/lib/name-format'

describe('normalizeFullName', () => {
  it('normalizes delimiters and casing', () => {
    expect(normalizeFullName('john_doe-smith')).toBe('John Doe Smith')
  })

  it('falls back to email prefix when input is empty', () => {
    expect(normalizeFullName('   ', 'mary.jane@example.com')).toBe('Mary Jane')
  })
})
