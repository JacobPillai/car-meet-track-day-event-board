// Read the newest email for a testmail.app tag. Run it from your own terminal:
//   TESTMAIL_API_KEY=xxxx TESTMAIL_NAMESPACE=myzm3 node scripts/check-testmail.mjs signup1
// Then register in the app with  <namespace>.signup1@inbox.testmail.app
// The API key stays in your shell or a git-ignored .env.test file. Never put it in src/ or a VITE_ variable.
import { readFileSync, existsSync } from 'node:fs'

if (existsSync('.env.test')) {
  for (const line of readFileSync('.env.test', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}
const key = process.env.TESTMAIL_API_KEY
const ns = process.env.TESTMAIL_NAMESPACE
const tag = process.argv[2]
if (!key || !ns || !tag) {
  console.error('Need TESTMAIL_API_KEY, TESTMAIL_NAMESPACE and a tag: node scripts/check-testmail.mjs <tag>')
  process.exit(1)
}
const url = `https://api.testmail.app/api/json?apikey=${encodeURIComponent(key)}&namespace=${encodeURIComponent(ns)}&tag=${encodeURIComponent(tag)}&livequery=true&timestamp_from=${Date.now() - 10 * 60 * 1000}`
const res = await fetch(url)
const data = await res.json()
if (data.result !== 'success') {
  console.error('testmail error:', data.message || data)
  process.exit(1)
}
if (!data.emails.length) {
  console.log('No email yet for tag', tag)
} else {
  for (const e of data.emails) console.log(`from: ${e.from}\nsubject: ${e.subject}\n${e.text}\n---`)
}
