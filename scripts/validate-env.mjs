const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const missing = required.filter((key) => {
  const value = process.env[key]
  return !value || value.trim().length === 0
})

if (missing.length > 0) {
  console.error('Missing required environment variables:')
  missing.forEach((key) => console.error(`- ${key}`))
  process.exit(1)
}

console.log('Environment validation passed.')
