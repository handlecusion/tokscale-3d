import type { PerDay, Stats, TokscalePayload } from './types'
import { computeStreaks } from './streaks'

export function computeStats(payload: TokscalePayload, selectedClients: Set<string>): Stats {
  const perDay: PerDay[] = []
  const perDayMap = new Map<string, PerDay>()
  const present = new Set<string>()

  let totalTokens = 0
  let totalCost = 0
  let bestDay: { date: string; cost: number } | null = null
  let maxTokens = 0

  for (const c of payload.contributions) {
    let dayTokens = 0
    let dayCost = 0
    for (const cc of c.clients) {
      present.add(cc.client)
      if (!selectedClients.has(cc.client)) continue
      const t = cc.tokens
      dayTokens += (t.input || 0) + (t.output || 0) + (t.cacheRead || 0) + (t.cacheWrite || 0) + (t.reasoning || 0)
      dayCost += cc.cost || 0
    }
    if (dayTokens === 0 && dayCost === 0) continue
    const entry: PerDay = { date: c.date, tokens: dayTokens, cost: dayCost, intensity: c.intensity }
    perDay.push(entry)
    perDayMap.set(c.date, entry)
    totalTokens += dayTokens
    totalCost += dayCost
    if (dayTokens > maxTokens) maxTokens = dayTokens
    if (!bestDay || dayCost > bestDay.cost) bestDay = { date: c.date, cost: dayCost }
  }

  const activeDays = perDay.length
  const averagePerDay = activeDays > 0 ? totalCost / activeDays : 0
  const dateRange = payload.meta.dateRange
  const streaks = computeStreaks(perDayMap, dateRange.start, dateRange.end)

  return {
    totalTokens,
    totalCost,
    activeDays,
    bestDay,
    averagePerDay,
    dateRange,
    perDay,
    perDayMap,
    streaks,
    presentClients: Array.from(present).sort(),
    years: payload.years,
    maxTokens,
  }
}
