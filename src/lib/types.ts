export interface TokenBreakdown {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  reasoning: number
}

export interface ContributionClient {
  client: string
  modelId: string
  providerId: string
  tokens: TokenBreakdown
  cost: number
  messages: number
}

export interface Contribution {
  date: string
  totals: { tokens: number; cost: number; messages: number }
  intensity: number
  tokenBreakdown: TokenBreakdown
  clients: ContributionClient[]
}

export interface YearMeta {
  year: string
  totalTokens: number
  totalCost: number
  range: { start: string; end: string }
}

export interface TokscalePayload {
  meta: {
    generatedAt: string
    version: string
    dateRange: { start: string; end: string }
  }
  summary: {
    totalTokens: number
    totalCost: number
    totalDays: number
    activeDays: number
    averagePerDay: number
    maxCostInSingleDay: number
    clients: string[]
    models: string[]
  }
  years: YearMeta[]
  contributions: Contribution[]
}

export interface StreamEnvelope {
  year: string
  fetchedAt: string
  payload: TokscalePayload
}

export interface PerDay {
  date: string
  tokens: number
  cost: number
  intensity: number
}

export interface Stats {
  totalTokens: number
  totalCost: number
  activeDays: number
  bestDay: { date: string; cost: number } | null
  averagePerDay: number
  dateRange: { start: string; end: string }
  perDay: PerDay[]
  perDayMap: Map<string, PerDay>
  streaks: { longest: number; current: number }
  presentClients: string[]
  years: YearMeta[]
  maxTokens: number
}
