export function normalizeFullName(inputName: string, fallbackEmail?: string) {
  const cleanedInput = inputName.trim().replace(/\s+/g, ' ')

  const source = cleanedInput.length > 0
    ? cleanedInput
    : (fallbackEmail?.split('@')[0] ?? '')

  const withSeparators = source
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

  if (!withSeparators) return ''

  return withSeparators
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}