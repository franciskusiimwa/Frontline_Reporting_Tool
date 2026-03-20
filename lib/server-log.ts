function toLogLine(level: 'ERROR' | 'WARN', message: string, error?: unknown): string {
  if (!error) return `[${level}] ${message}\n`

  if (error instanceof Error) {
    const stack = error.stack ? `\n${error.stack}` : ''
    return `[${level}] ${message}: ${error.message}${stack}\n`
  }

  return `[${level}] ${message}: ${JSON.stringify(error)}\n`
}

export function logServerError(message: string, error?: unknown): void {
  process.stderr.write(toLogLine('ERROR', message, error))
}

export function logServerWarn(message: string, details?: unknown): void {
  process.stderr.write(toLogLine('WARN', message, details))
}
