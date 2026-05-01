import React from 'react'
import type { GridLayout } from '../lib/grid'
import { formatCost, formatMonthDay, humanizeTokens } from '../lib/format'

export function ContributionGraph2D({ grid }: { grid: GridLayout }) {
  const cellSize = 12
  const gap = 3
  const width = grid.cols * (cellSize + gap)
  const height = grid.rows * (cellSize + gap)
  const max = Math.max(grid.maxTokens, 1)

  return (
    <div className="graph-2d-wrap">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {grid.cells.map((c, i) => {
          if (!c.inYear) return null
          const x = c.col * (cellSize + gap)
          const y = c.row * (cellSize + gap)
          let fill = '#e5e7eb'
          if (c.active) {
            const t = Math.pow(c.tokens / max, 0.6)
            const op = 0.25 + t * 0.75
            fill = `rgba(37, 99, 235, ${op.toFixed(3)})`
          }
          return (
            <rect key={i} x={x} y={y} width={cellSize} height={cellSize} rx={2} fill={fill}>
              {c.active && (
                <title>{`${formatMonthDay(c.date)} • ${humanizeTokens(c.tokens)} • ${formatCost(c.cost)}`}</title>
              )}
            </rect>
          )
        })}
      </svg>
    </div>
  )
}
