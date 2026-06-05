/**
 * Provider factory — selects the right adapter based on env config.
 */
import type { FootballDataProvider } from './types'
import { ManualAdapter } from './manual-adapter'
import { ApiFootballAdapter } from './api-football-adapter'

export function getFootballDataProvider(): FootballDataProvider {
  const provider = process.env.FOOTBALL_DATA_PROVIDER ?? 'manual'

  switch (provider) {
    case 'api-football': {
      const key = process.env.API_FOOTBALL_KEY
      const base = process.env.API_FOOTBALL_BASE_URL
      if (!key) {
        console.warn('[FootballData] api-football selected but API_FOOTBALL_KEY not set. Falling back to manual.')
        return new ManualAdapter()
      }
      return new ApiFootballAdapter(key, base)
    }

    case 'manual':
    default:
      return new ManualAdapter()
  }
}

export { ManualAdapter, ApiFootballAdapter }
export type { FootballDataProvider }
export * from './types'
