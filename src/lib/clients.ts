export interface ClientStyle {
  id: string
  displayName: string
  color: string // logo disc color
}

const REGISTRY: Record<string, { displayName: string; color: string }> = {
  claude: { displayName: 'Claude Code', color: '#d97706' },
  openclaw: { displayName: 'OpenClaw', color: '#dc2626' },
  gemini: { displayName: 'Gemini CLI', color: '#60a5fa' },
  opencode: { displayName: 'OpenCode', color: '#1f2937' },
  codex: { displayName: 'Codex CLI', color: '#9ca3af' },
  copilot: { displayName: 'Copilot CLI', color: '#1f2937' },
  cursor: { displayName: 'Cursor IDE', color: '#0ea5e9' },
  amp: { displayName: 'Amp', color: '#10b981' },
  droid: { displayName: 'Droid', color: '#22c55e' },
  hermes: { displayName: 'Hermes', color: '#a78bfa' },
  pi: { displayName: 'Pi', color: '#f472b6' },
  kimi: { displayName: 'Kimi CLI', color: '#fbbf24' },
  qwen: { displayName: 'Qwen CLI', color: '#7c3aed' },
  roocode: { displayName: 'Roo Code', color: '#ef4444' },
  kilocode: { displayName: 'KiloCode', color: '#f97316' },
  kilo: { displayName: 'Kilo CLI', color: '#f59e0b' },
  mux: { displayName: 'Mux', color: '#06b6d4' },
  crush: { displayName: 'Crush', color: '#ec4899' },
  synthetic: { displayName: 'Synthetic', color: '#64748b' },
}

export function getClientStyle(id: string): ClientStyle {
  const entry = REGISTRY[id]
  if (entry) return { id, displayName: entry.displayName, color: entry.color }
  // Fallback: title-case the id, neutral grey disc
  const displayName = id.charAt(0).toUpperCase() + id.slice(1)
  return { id, displayName, color: '#6b7280' }
}

export function clientInitial(displayName: string): string {
  return displayName.charAt(0).toUpperCase()
}
