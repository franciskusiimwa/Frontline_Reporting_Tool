// run-migrations.mjs
// Connects directly to Supabase PostgreSQL pooler and runs all migrations
// Usage: node run-migrations.mjs

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Project ref must come from environment — never hardcode it.
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF
if (!PROJECT_REF) {
  console.error('❌ Missing SUPABASE_PROJECT_REF env var (e.g. export SUPABASE_PROJECT_REF=abcdefghijklmnop).')
  process.exit(1)
}

const DB_USER = `postgres.${PROJECT_REF}`
const DB_NAME = 'postgres'
const DB_PASSWORD = process.env.DB_PASSWORD

if (!DB_PASSWORD) {
  console.error('❌ Missing DB_PASSWORD env var.')
  process.exit(1)
}

// Supabase pooler hosts to try in order
const POOLER_HOSTS = [
  { host: `aws-0-eu-central-1.pooler.supabase.com`, port: 5432, mode: 'Session (EU)' },
  { host: `aws-0-us-east-1.pooler.supabase.com`, port: 5432, mode: 'Session (US-E)' },
  { host: `aws-0-us-west-1.pooler.supabase.com`, port: 5432, mode: 'Session (US-W)' },
  { host: `aws-0-ap-southeast-1.pooler.supabase.com`, port: 5432, mode: 'Session (AP)' },
]

const migrationsDir = join(__dirname, 'supabase', 'migrations')
const migrations = readdirSync(migrationsDir)
  .filter((file) => /^\d+_.*\.sql$/i.test(file))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

const { default: pg } = await import('pg')
const { Client } = pg

async function tryConnect(config) {
  const client = new Client({ ...config, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 })
  try {
    await client.connect()
    return client
  } catch {
    return null
  }
}

async function main() {
  console.log('🗄️  Connecting to Supabase...')

  let client = null
  for (const { host, port, mode } of POOLER_HOSTS) {
    process.stdout.write(`   Trying ${mode}... `)
    client = await tryConnect({ host, port, user: DB_USER, password: DB_PASSWORD, database: DB_NAME })
    if (client) {
      console.log('✅ Connected!')
      break
    }
    console.log('✗')
  }

  if (!client) {
    console.error('\n❌ Could not connect via any pooler host.')
    console.error('   Please run migrations manually in the Supabase SQL Editor.')
    console.error('   See: SUPABASE_SETUP.md for step-by-step instructions.')
    process.exit(1)
  }

  console.log('\n' + '─'.repeat(50))

  for (const file of migrations) {
    const filePath = join(migrationsDir, file)
    const sql = readFileSync(filePath, 'utf8')
    process.stdout.write(`Running ${file}... `)
    try {
      await client.query(sql)
      console.log('✅')
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('⚠️  (already applied)')
      } else {
        console.log('❌')
        console.error('   Error:', err.message)
      }
    }
  }

  await client.end()
  console.log('─'.repeat(50))
  console.log('\n✅ All migrations finished!')
}

main()

