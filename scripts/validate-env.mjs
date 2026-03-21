const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

// In production, rate limiting and the public URL are also required.
const requiredInProduction = [
  'NEXT_PUBLIC_APP_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

const missing = required.filter((key) => {
  const value = process.env[key]
  return !value || value.trim().length === 0
})

if (process.env.NODE_ENV === 'production') {
  const missingProd = requiredInProduction.filter((key) => {
    const value = process.env[key]
    return !value || value.trim().length === 0
  })
  missing.push(...missingProd)
}

if (missing.length > 0) {
  console.error('Missing required environment variables:')
  missing.forEach((key) => console.error(`- ${key}`))
  process.exit(1)
}

console.log('Environment validation passed.')
