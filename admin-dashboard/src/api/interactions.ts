import { get } from './client'
import type { PaginatedData, Interaction, InteractionQuery, InteractionStatsData } from '@/types'

export function getInteractions(params: InteractionQuery) {
  return get<PaginatedData<Interaction>>(
    '/api/admin/interactions',
    params as unknown as Record<string, unknown>,
  )
}

export function getInteractionStats() {
  return get<InteractionStatsData>('/api/admin/interactions/stats')
}
