import { get } from './client'
import type { SocialNetworkData } from '@/types'

export function getUserNetwork(userId: number) {
  return get<SocialNetworkData>(`/api/admin/users/${userId}/network`)
}
