type SubmissionCursorPayload = {
  createdAt: string
}

export function encodeSubmissionCursor(payload: SubmissionCursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

export function decodeSubmissionCursor(cursor: string | null): SubmissionCursorPayload | null {
  if (!cursor) return null

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as SubmissionCursorPayload
    if (!parsed.createdAt || Number.isNaN(Date.parse(parsed.createdAt))) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}