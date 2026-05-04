import React from 'react'
import { humanizeTokens } from '../lib/format'

interface Props {
  totalTokens: number
  year: string
  years: string[]
  onYearChange: (y: string) => void
  theme: string
  onThemeChange: (t: string) => void
  view: '2D' | '3D'
  onViewChange: (v: '2D' | '3D') => void
  onOpenSettings?: () => void
}

export function HeaderBar({ totalTokens, year, years, onYearChange, theme, onThemeChange, view, onViewChange, onOpenSettings }: Props) {
  return (
    <div className="header-bar">
      <div className="header-brand">
        <img className="brand-logo" src="/tokcat-logo.png" alt="" aria-hidden="true" />
        <div className="header-title">
          <span className="header-num">{humanizeTokens(totalTokens)}</span>
          <span className="header-text"> tokens used in </span>
          <select className="year-select" value={year} onChange={e => onYearChange(e.target.value)}>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="header-controls">
        <select className="theme-select" value={theme} onChange={e => onThemeChange(e.target.value)}>
          <option value="Blue">Blue</option>
        </select>
        <div className="view-toggle">
          <button className={view === '2D' ? 'active' : ''} onClick={() => onViewChange('2D')}>2D</button>
          <button className={view === '3D' ? 'active' : ''} onClick={() => onViewChange('3D')}>3D</button>
        </div>
        {onOpenSettings && (
          <button className="settings-btn" onClick={onOpenSettings} aria-label="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
