import { useEffect, useState } from 'react'

/**
 * Debounce a value over a timeout.
 */
export function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/**
 * Fetch with standardized API response shape.
 */
export async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<{ data: T | null; error: string | null; status: number }> {
  const response = await fetch(input, init)
  const body = await response.json().catch(() => null)

  if (!response.ok || !body) {
    return {
      data: null,
      error: (body && 'error' in body && body.error) || 'Network error',
      status: response.status,
    }
  }

  return {
    data: body.data ?? null,
    error: body.error ?? null,
    status: response.status,
  }
}
