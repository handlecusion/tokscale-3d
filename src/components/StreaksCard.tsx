import React from 'react'

interface Props {
  longest: number
  current: number
}

export function StreaksCard({ longest, current }: Props) {
  return (
    <div className="streaks-card">
      <h2 className="streaks-heading">Streaks</h2>
      <div className="streaks-row">
        <div className="streak-item">
          <div className="streak-num">{longest} days</div>
          <div className="streak-label">Longest</div>
        </div>
        <div className="streak-item">
          <div className="streak-num">{current} days</div>
          <div className="streak-label">Current</div>
        </div>
      </div>
    </div>
  )
}
