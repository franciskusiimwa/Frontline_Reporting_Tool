// run-migrations.mjs
// Connects directly to Supabase PostgreSQL pooler and runs all migrations
// Usage: node run-migrations.mjs

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROJECT_REF = 'ryllvnaypwblvcjnupev'
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

const migrations = [
  '001_schema.sql',
  '002_rls.sql',
  '003_seed_weeks.sql',
]

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
    console.error('   See: MANUAL_MIGRATION.md for step-by-step instructions.')
    process.exit(1)
  }

  console.log('\n' + '─'.repeat(50))

  for (const file of migrations) {
    const filePath = join(__dirname, 'supabase', 'migrations', file)
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

