import React, { useEffect, useMemo, useState } from 'react'
import { Panel } from './components/Panel'
import { HeaderBar } from './components/HeaderBar'
import { FilterChips } from './components/FilterChips'
import { InnerCard } from './components/InnerCard'
import { TokenUsageCard } from './components/TokenUsageCard'
import { StreaksCard } from './components/StreaksCard'
import { ContributionGraph2D } from './components/ContributionGraph2D'
import { ContributionGraph3D } from './components/ContributionGraph3D'
import { useGraphStream } from './hooks/useGraphStream'
import { computeStats } from './lib/stats'
import { buildGrid } from './lib/grid'
import { formatCost } from './lib/format'

function defaultYear(): string {
  return String(new Date().getFullYear())
}

export default function App() {
  const [year, setYear] = useState<string>(defaultYear())
  const { payload, error } = useGraphStream(year)
  const [theme, setTheme] = useState<string>('Blue')
  const [view, setView] = useState<'2D' | '3D'>('3D')
  const [selected, setSelected] = useState<Set<string> | null>(null)

  const [knownClients, setKnownClients] = useState<Set<string>>(new Set())

  // Initialize / reconcile selected clients when payload arrives.
  useEffect(() => {
    if (!payload) return
    const present = new Set<string>()
    for (const c of payload.contributions) for (const cc of c.clients) present.add(cc.client)
    setSelected(prev => {
      if (!prev) return new Set(present)
      const next = new Set<string>()
      for (const id of present) {
        if (knownClients.has(id)) {
          if (prev.has(id)) next.add(id)
        } else {
          next.add(id)
        }
      }
      if (next.size === prev.size) {
        let same = true
        for (const id of next) if (!prev.has(id)) { same = false; break }
        if (same) return prev
      }
      return next
    })
    setKnownClients(prev => {
      let added = false
      for (const id of present) if (!prev.has(id)) { added = true; break }
      if (!added) return prev
      const merged = new Set(prev)
      for (const id of present) merged.add(id)
      return merged
    })
  }, [payload])

  const stats = useMemo(() => {
    if (!payload || !selected) return null
    return computeStats(payload, selected)
  }, [payload, selected])

  const grid = useMemo(() => {
    if (!stats) return null
    return buildGrid(year, stats.perDayMap)
  }, [stats, year])

  const allYears = useMemo(() => {
    if (!payload) return [year]
    return payload.years.map(y => y.year)
  }, [payload, year])

  const presentClients = useMemo(() => {
    if (!payload) return []
    const set = new Set<string>()
    for (const c of payload.contributions) for (const cc of c.clients) set.add(cc.client)
    return Array.from(set).sort()
  }, [payload])

  function toggleClient(id: string) {
    setSelected(prev => {
      const next = new Set(prev ?? [])
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="page">
      <Panel>
        {!payload && !error && <div className="loading">Loading…</div>}
        {error && <div className="error">Error: {error}</div>}
        {payload && stats && grid && selected && (
          <>
            <HeaderBar
              totalTokens={stats.totalTokens}
              year={year}
              years={allYears}
              onYearChange={setYear}
              theme={theme}
              onThemeChange={setTheme}
              view={view}
              onViewChange={setView}
            />
            <FilterChips presentClients={presentClients} selected={selected} onToggle={toggleClient} />
            <InnerCard>
              <div className="card-grid">
                <div className="card-graph" key={view}>
                  {view === '3D' ? (
                    <ContributionGraph3D grid={grid} />
                  ) : (
                    <ContributionGraph2D grid={grid} />
                  )}
                </div>
                <div className="card-side">
                  <TokenUsageCard stats={stats} />
                </div>
              </div>
            </InnerCard>
            <div className="below-card">
              <div className="below-left">
                <StreaksCard longest={stats.streaks.longest} current={stats.streaks.current} />
              </div>
              <div className="below-right">
                Average: {formatCost(stats.averagePerDay)} / day
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}

