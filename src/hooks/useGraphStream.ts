import { useEffect, useRef, useState } from 'react'
import type { StreamEnvelope, TokscalePayload } from '../lib/types'

interface State {
  payload: TokscalePayload | null
  fetchedAt: string | null
  error: string | null
}

export function useGraphStream(year: string): State {
  const [state, setState] = useState<State>({ payload: null, fetchedAt: null, error: null })
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!year) return
    const es = new EventSource(`/api/stream?year=${encodeURIComponent(year)}`)
    esRef.current = es
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
    return () => {
      es.close()
      esRef.current = null
    }
  }, [year])

  return state
}
