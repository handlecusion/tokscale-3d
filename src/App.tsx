import React, { useEffect, useMemo, useState } from 'react'
import { Panel } from './components/Panel'
import { HeaderBar } from './components/HeaderBar'
import { FilterChips } from './components/FilterChips'
import { InnerCard } from './components/InnerCard'
import { TokenUsageCard } from './components/TokenUsageCard'
import { StreaksCard } from './components/StreaksCard'
import { ContributionGraph2D } from './components/ContributionGraph2D'
import { ContributionGraph3D } from './components/ContributionGraph3D'
import { SettingsPanel } from './components/SettingsPanel'
import { TokscaleSetup } from './components/TokscaleSetup'
import { useGraphStream } from './hooks/useGraphStream'
import { computeStats } from './lib/stats'
import { buildGrid } from './lib/grid'
import { formatCost } from './lib/format'
import { isTauri } from './lib/runtime'
import { computeTrayTitle, loadSettings, saveSettings, Settings } from './lib/settings'
import { checkForUpdatesSilent, checkForUpdatesInteractive } from './lib/updater'

function defaultYear(): string {
  return String(new Date().getFullYear())
}

export default function App() {
  const [year, setYear] = useState<string>(defaultYear())
  const { payload, error } = useGraphStream(year)
  const [theme, setTheme] = useState<string>('Blue')
  const [view, setView] = useState<'2D' | '3D'>('3D')
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [knownClients, setKnownClients] = useState<Set<string>>(new Set())
  const [aboutOpen, setAboutOpen] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [tokscaleSetup, setTokscaleSetup] = useState<{
    state: 'missing' | 'outdated'
    detected: string | null
    minVersion: string
  } | null>(null)

  async function checkTokscale() {
    if (!isTauri()) return
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const info: any = await invoke('get_tokscale_info')
      if (!info?.version) {
        setTokscaleSetup({ state: 'missing', detected: null, minVersion: info?.min_version ?? '2.0.0' })
      } else if (info.outdated) {
        setTokscaleSetup({ state: 'outdated', detected: info.version, minVersion: info.min_version })
      } else {
        setTokscaleSetup(null)
      }
    } catch {
      // Backend not reachable — leave dialog hidden.
    }
  }

  useEffect(() => {
    void checkTokscale()
  }, [])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    if (!isTauri()) return
    let unlisten: (() => void) | null = null
    ;(async () => {
      const { listen } = await import('@tauri-apps/api/event')
      unlisten = await listen<string>('tray-action', e => {
        const action = e.payload
        if (action === 'open-settings') setSettingsOpen(true)
        else if (action === 'open-about') setAboutOpen(true)
        else if (action === 'refresh') setRefreshTick(t => t + 1)
        else if (action === 'check-update') void checkForUpdatesInteractive()
      })
    })()
    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  // Silent update check on startup, then every 30 min while the app runs.
  // Without the recurring tick, releases published after launch are only
  // surfaced on the next restart.
  useEffect(() => {
    if (!isTauri()) return
    void checkForUpdatesSilent()
    const id = window.setInterval(() => {
      void checkForUpdatesSilent()
    }, 30 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  // Manual refresh from tray menu — bypasses cache.
  useEffect(() => {
    if (refreshTick === 0) return
    if (!isTauri()) return
    ;(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('refresh_graph', { year })
      } catch {}
    })()
  }, [refreshTick, year])

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

  // Push tray title whenever stats or trayMode changes (Tauri only).
  useEffect(() => {
    if (!isTauri()) return
    const title = computeTrayTitle(settings.trayMode, stats)
    ;(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('update_tray_title', { title })
      } catch (e) {
        // ignore
      }
    })()
  }, [stats, settings.trayMode])

  // Push animateTray flag to backend whenever it changes (Tauri only).
  useEffect(() => {
    if (!isTauri()) return
    ;(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('set_animate_tray', { enabled: settings.animateTray })
      } catch {}
    })()
  }, [settings.animateTray])

  // Push animationStyle to backend whenever it changes (Tauri only).
  useEffect(() => {
    if (!isTauri()) return
    ;(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('set_animation_style', { style: settings.animationStyle })
      } catch {}
    })()
  }, [settings.animationStyle])

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
              onOpenSettings={() => setSettingsOpen(true)}
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
                {view === '3D' && (
                  <div className="overlay-tr">
                    <TokenUsageCard stats={stats} />
                    <div className="overlay-avg">
                      Average: <span className="overlay-avg-num">{formatCost(stats.averagePerDay)}</span> / day
                    </div>
                  </div>
                )}
                <div className="overlay-bl">
                  <StreaksCard longest={stats.streaks.longest} current={stats.streaks.current} />
                </div>
              </div>
            </InnerCard>
          </>
        )}
      </Panel>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
      />
      {tokscaleSetup && (
        <TokscaleSetup
          state={tokscaleSetup.state}
          detected={tokscaleSetup.detected}
          minVersion={tokscaleSetup.minVersion}
          onDismiss={() => setTokscaleSetup(null)}
          onRecheck={checkTokscale}
        />
      )}
      {aboutOpen && (
        <>
          <div className="settings-overlay" onClick={() => setAboutOpen(false)} />
          <div className="settings-panel" role="dialog">
            <div className="settings-head">
              <strong>About Tokcat</strong>
              <button className="settings-close" onClick={() => setAboutOpen(false)}>×</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <div><strong>Tokcat</strong> — version 0.1.4</div>
              <div style={{ marginTop: 8 }}>
                Native macOS menubar dashboard for the <code>tokscale</code> CLI.
              </div>
              <div style={{ marginTop: 8 }}>
                <a
                  href="https://github.com/handlecusion/tokcat"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--blue)' }}
                >
                  github.com/handlecusion/tokcat
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
