import type { PerDay } from './types'
import { addDays, diffDays, isoDate, parseISODate } from './format'

export interface GridCell {
  col: number
  row: number
  date: string
  inYear: boolean
  active: boolean
  tokens: number
  cost: number
}

export interface GridLayout {
  cols: number
  rows: number // 7
  cells: GridCell[]
  maxTokens: number
}

// GitHub layout: 53 columns, 7 rows. Sun on top.
// col 0 row 0 = the Sunday on or before Jan 1 of `year`.
export function buildGrid(year: string, perDayMap: Map<string, PerDay>): GridLayout {
  const y = Number(year)
  const jan1 = new Date(y, 0, 1)
  // Sunday-or-before:
  const dayOfWeek = jan1.getDay() // Sun=0..Sat=6
  const start = addDays(jan1, -dayOfWeek)

  // dec31:
  const dec31 = new Date(y, 11, 31)
  const lastCol = Math.floor(diffDays(dec31, start) / 7)
  const cols = Math.max(53, lastCol + 1)

  const cells: GridCell[] = []
  let maxTokens = 0
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < 7; row++) {
      const d = addDays(start, col * 7 + row)
      const inYear = d.getFullYear() === y
      const dateStr = isoDate(d)
      const entry = perDayMap.get(dateStr)
      const tokens = entry?.tokens ?? 0
      const cost = entry?.cost ?? 0
      const active = inYear && tokens > 0
      if (active && tokens > maxTokens) maxTokens = tokens
      cells.push({ col, row, date: dateStr, inYear, active, tokens, cost })
    }
  }

  return { cols, rows: 7, cells, maxTokens }
}
