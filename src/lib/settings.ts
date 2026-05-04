import type { Stats } from './types'
import { humanizeTokens, formatCost, isoDate } from './format'

export type TrayMode = 'today_tokens' | 'today_cost' | 'total_tokens' | 'total_cost' | 'hidden'
export type AnimationStyle = 'cube' | 'cat'

export interface Settings {
  trayMode: TrayMode
  autostart: boolean
  animateTray: boolean
  animationStyle: AnimationStyle
}

export const DEFAULT_SETTINGS: Settings = {
  trayMode: 'today_tokens',
  autostart: false,
  animateTray: true,
  animationStyle: 'cat',
}

export const ANIMATION_STYLE_LABELS: Record<AnimationStyle, string> = {
  cube: 'Wireframe cube',
  cat: 'Spinning cat',
}

const KEY = 'tokscale3d:settings:v1'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
}

export const TRAY_MODE_LABELS: Record<TrayMode, string> = {
  today_tokens: "Today's tokens (50M)",
  today_cost: "Today's cost ($5.20)",
  total_tokens: 'Total tokens (1.5B)',
  total_cost: 'Total cost ($889)',
  hidden: 'Icon only',
}

export function computeTrayTitle(mode: TrayMode, stats: Stats | null): string {
  if (mode === 'hidden' || !stats) return ''
  const today = isoDate(new Date())
  const todayEntry = stats.perDayMap.get(today)
  switch (mode) {
    case 'today_tokens':
      return todayEntry ? humanizeTokens(todayEntry.tokens) : '0'
    case 'today_cost':
      return todayEntry ? formatCost(todayEntry.cost) : '$0.00'
    case 'total_tokens':
      return humanizeTokens(stats.totalTokens)
    case 'total_cost':
      return formatCost(stats.totalCost)
  }
}
