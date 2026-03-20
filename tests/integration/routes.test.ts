import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createClientMock,
  assertRateLimitMock,
  listSubmissionsMock,
  submitSubmissionMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  assertRateLimitMock: vi.fn(),
  listSubmissionsMock: vi.fn(),
  submitSubmissionMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  assertRateLimit: assertRateLimitMock,
}))

vi.mock('@/lib/services/submissions', () => ({
  listSubmissions: listSubmissionsMock,
  submitSubmission: submitSubmissionMock,
  approveSubmission: vi.fn(),
}))

describe('API route smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertRateLimitMock.mockResolvedValue({ allowed: true })
  })

  it('GET /api/health returns 200 when database is reachable', async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })

    const { GET } = await import('@/app/api/health/route')
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ data: { status: 'ok' }, error: null })
  })

  it('GET /api/submissions returns 401 when unauthenticated', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    })

    const { GET } = await import('@/app/api/submissions/route')
    const request = new Request('http://localhost:3000/api/submissions')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('GET /api/submissions returns 400 for invalid cursor', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { role: 'admin', region: 'Central' },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: vi.fn(() => ({ select })),
    })

    const { GET } = await import('@/app/api/submissions/route')
    const request = new Request('http://localhost:3000/api/submissions?cursor=bad-cursor')
    const response = await GET(request)

    expect(response.status).toBe(400)
    expect(listSubmissionsMock).not.toHaveBeenCalled()
  })

  it('POST /api/submit returns 401 when unauthenticated', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    })

    const { POST } = await import('@/app/api/submit/route')
    const request = new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('PATCH /api/draft returns 401 when unauthenticated', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    })

    const { PATCH } = await import('@/app/api/draft/route')
    const request = new Request('http://localhost:3000/api/draft', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(401)
  })
})
