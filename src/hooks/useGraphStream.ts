import { useEffect, useRef, useState } from 'react'
import type { StreamEnvelope, TokscalePayload } from '../lib/types'
import { isTauri } from '../lib/runtime'

interface State {
  payload: TokscalePayload | null
  fetchedAt: string | null
  error: string | null
}

export function useGraphStream(year: string): State {
  const [state, setState] = useState<State>({ payload: null, fetchedAt: null, error: null })
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!year) return
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    let disposed = false

    if (isTauri()) {
      let unlisten: (() => void) | null = null
      ;(async () => {
        try {
          const { invoke } = await import('@tauri-apps/api/core')
          const { listen } = await import('@tauri-apps/api/event')
          // Listen for periodic updates first to avoid missing the initial push.
          unlisten = await listen<StreamEnvelope>('graph-update', e => {
            const env = e.payload
            if (!env || env.year !== year) return
            if (disposed) return
            setState({ payload: env.payload, fetchedAt: env.fetchedAt, error: null })
          })
          const env = await invoke<StreamEnvelope>('get_graph', { year })
          if (disposed) return
          setState({ payload: env.payload, fetchedAt: env.fetchedAt, error: null })
        } catch (err) {
          if (disposed) return
          setState(s => ({ ...s, error: (err as Error).message ?? String(err) }))
        }
      })()
      cleanupRef.current = () => {
        disposed = true
        if (unlisten) unlisten()
      }
      return () => {
        if (cleanupRef.current) cleanupRef.current()
        cleanupRef.current = null
      }
    }

    // Browser fallback: SSE via Express server.
    const es = new EventSource(`/api/stream?year=${encodeURIComponent(year)}`)
    es.addEventListener('data', ev => {
      try {
        const env: StreamEnvelope = JSON.parse((ev as MessageEvent).data)
        setState({ payload: env.payload, fetchedAt: env.fetchedAt, error: null })
      } catch (e) {
        setState(s => ({ ...s, error: (e as Error).message }))
      }
    })
    es.addEventListener('error', () => {
      setState(s => ({ ...s, error: 'stream error' }))
    })
    cleanupRef.current = () => {
      es.close()
    }
    return () => {
      if (cleanupRef.current) cleanupRef.current()
      cleanupRef.current = null
    }
  }, [year])

  return state
}
