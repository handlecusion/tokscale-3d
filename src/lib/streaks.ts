import { addDays, diffDays, isoDate, parseISODate } from './format'

export function computeStreaks(
  perDayMap: Map<string, { tokens: number }>,
  rangeStart: string,
  rangeEnd: string,
): { longest: number; current: number } {
  const start = parseISODate(rangeStart)
  const end = parseISODate(rangeEnd)
  const total = diffDays(end, start) + 1
  if (total <= 0) return { longest: 0, current: 0 }

  let longest = 0
  let run = 0
  let current = 0
  for (let i = 0; i < total; i++) {
    const d = addDays(start, i)
    const key = isoDate(d)
    const entry = perDayMap.get(key)
    const active = !!entry && entry.tokens > 0
    if (active) {
      run += 1
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }
  // current streak: count back from end
  for (let i = total - 1; i >= 0; i--) {
    const d = addDays(start, i)
    const key = isoDate(d)
    const entry = perDayMap.get(key)
    const active = !!entry && entry.tokens > 0
    if (active) current += 1
    else break
  }
  return { longest, current }
}
