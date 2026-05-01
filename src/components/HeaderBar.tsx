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
}

export function HeaderBar({ totalTokens, year, years, onYearChange, theme, onThemeChange, view, onViewChange }: Props) {
  return (
    <div className="header-bar">
      <div className="header-title">
        <span className="header-num">{humanizeTokens(totalTokens)}</span>
        <span className="header-text"> tokens used in </span>
        <select className="year-select" value={year} onChange={e => onYearChange(e.target.value)}>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="header-controls">
        <select className="theme-select" value={theme} onChange={e => onThemeChange(e.target.value)}>
          <option value="Blue">Blue</option>
        </select>
        <div className="view-toggle">
          <button className={view === '2D' ? 'active' : ''} onClick={() => onViewChange('2D')}>2D</button>
          <button className={view === '3D' ? 'active' : ''} onClick={() => onViewChange('3D')}>3D</button>
        </div>
      </div>
    </div>
  )
}
