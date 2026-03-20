import { assertRateLimit } from '@/lib/rate-limit'

describe('rate limit', () => {
  it('allows requests within threshold then blocks', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    })

    const first = await assertRateLimit(request, { key: 'unit-test-rate', limit: 2, windowMs: 60_000 })
    const second = await assertRateLimit(request, { key: 'unit-test-rate', limit: 2, windowMs: 60_000 })
    const third = await assertRateLimit(request, { key: 'unit-test-rate', limit: 2, windowMs: 60_000 })

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSeconds).toBeGreaterThan(0)
  })
})
