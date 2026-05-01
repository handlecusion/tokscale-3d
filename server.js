import express from 'express'
import { createServer as createViteServer } from 'vite'
import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 4061
const REFRESH_MS = 3 * 60 * 1000
const ONESHOT_MAX_AGE_MS = 30 * 1000
const TOKSCALE_BIN = '/opt/homebrew/bin/tokscale'

function spawnAndCollect(bin, args) {
  return new Promise((resolve, reject) => {
    let proc
    try {
      proc = spawn(bin, args)
    } catch (e) {
      return reject(e)
    }
    let stdout = ''
    let stderr = ''
    let settled = false
    const settle = fn => (...a) => { if (!settled) { settled = true; fn(...a) } }
    const ok = settle(resolve)
    const err = settle(reject)
    proc.stdout?.on('data', d => { stdout += d.toString() })
    proc.stderr?.on('data', d => { stderr += d.toString() })
    proc.on('error', e => err(e))
    proc.on('close', code => {
      if (code !== 0) return err(new Error(`${bin} exited ${code}: ${stderr}`))
      try { ok(JSON.parse(stdout)) } catch (e) { err(e) }
    })
  })
}

async function runTokscale(year) {
  const args = ['graph', '--no-spinner']
  if (year) args.push('--year', String(year))
  try {
    return await spawnAndCollect(TOKSCALE_BIN, args)
  } catch (e) {
    if (e && (e.code === 'ENOENT' || /ENOENT/.test(String(e.message)))) {
      return await spawnAndCollect('tokscale', args)
    }
    throw e
  }
}

// cache: year -> { data, lastFetched, subscribers: Set<res>, timer }
const cache = new Map()

function ensureEntry(year) {
  let entry = cache.get(year)
  if (!entry) {
    entry = { data: null, lastFetched: 0, subscribers: new Set(), timer: null }
    cache.set(year, entry)
  }
  return entry
}

async function fetchAndStore(year) {
  const entry = ensureEntry(year)
  const data = await runTokscale(year)
  entry.data = data
  entry.lastFetched = Date.now()
  return data
}

function broadcast(year) {
  const entry = cache.get(year)
  if (!entry || !entry.data) return
  const payload = JSON.stringify({
    year,
    fetchedAt: new Date(entry.lastFetched).toISOString(),
    payload: entry.data,
  })
  const msg = `event: data\ndata: ${payload}\n\n`
  for (const res of entry.subscribers) {
    try { res.write(msg) } catch {}
  }
}

function startTimer(year) {
  const entry = ensureEntry(year)
  if (entry.timer) return
  entry.timer = setInterval(async () => {
    try {
      await fetchAndStore(year)
      broadcast(year)
    } catch (err) {
      console.error(`[tokscale-3d] refresh error for ${year}:`, err.message)
    }
  }, REFRESH_MS)
}

function stopTimerIfIdle(year) {
  const entry = cache.get(year)
  if (!entry) return
  if (entry.subscribers.size === 0 && entry.timer) {
    clearInterval(entry.timer)
    entry.timer = null
  }
}

const app = express()

app.get('/api/graph', async (req, res) => {
  const year = String(req.query.year || '')
  try {
    const entry = ensureEntry(year)
    const stale = !entry.data || Date.now() - entry.lastFetched > ONESHOT_MAX_AGE_MS
    if (stale) await fetchAndStore(year)
    res.json(entry.data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/stream', async (req, res) => {
  const year = String(req.query.year || '')
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()
  req.socket.setKeepAlive(true)
  req.socket.setNoDelay(true)
  req.socket.setTimeout(0)

  const entry = ensureEntry(year)
  entry.subscribers.add(res)

  try {
    if (!entry.data) await fetchAndStore(year)
    const payload = JSON.stringify({
      year,
      fetchedAt: new Date(entry.lastFetched).toISOString(),
      payload: entry.data,
    })
    res.write(`event: data\ndata: ${payload}\n\n`)
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
  }

  const ka = setInterval(() => {
    try { res.write(`: keepalive ${Date.now()}\n\n`) } catch {}
  }, 25000)

  startTimer(year)
  console.log(`[sse] +sub year=${year} total=${entry.subscribers.size}`)

  req.on('close', () => {
    clearInterval(ka)
    entry.subscribers.delete(res)
    stopTimerIfIdle(year)
    console.log(`[sse] -sub year=${year} total=${entry.subscribers.size}`)
  })
})

const httpServer = http.createServer(app)

const vite = await createViteServer({
  root: __dirname,
  server: {
    middlewareMode: true,
    hmr: { server: httpServer, port: PORT },
  },
  appType: 'spa',
})
app.use(vite.middlewares)

httpServer.listen(PORT, () => {
  console.log(`[tokscale-3d] listening on http://localhost:${PORT}`)
})
