import type { MockMethod } from 'vite-plugin-mock'

const interactions = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  from_user: { id: Math.floor(Math.random() * 86) + 1, nickname: `用户_${Math.floor(Math.random() * 86) + 1}` },
  to_user: { id: Math.floor(Math.random() * 86) + 1, nickname: `用户_${Math.floor(Math.random() * 86) + 1}` },
  interaction_type: ['click', 'double_click', 'long_contact', 'internal_hook'][Math.floor(Math.random() * 4)] as string,
}))

function getNetwork(centerId: number) {
  const MAX_LEVEL1 = 8
  const MAX_LEVEL2_PER = 3

  // Level 1: users who interacted with center
  const centerInteractions = interactions.filter(
    (ix) => ix.from_user.id === centerId || ix.to_user.id === centerId
  )
  const level1Ids = new Set<number>()
  centerInteractions.forEach((ix) => {
    if (ix.from_user.id !== centerId) level1Ids.add(ix.from_user.id)
    if (ix.to_user.id !== centerId) level1Ids.add(ix.to_user.id)
  })
  const level1 = Array.from(level1Ids).slice(0, MAX_LEVEL1)

  // Level 2: users who interacted with level 1 users
  const level2Ids = new Set<number>()
  level2Ids.add(centerId) // exclude center
  level1.forEach((id) => level2Ids.add(id)) // exclude existing level 1
  const level2Map = new Map<number, number[]>()
  for (const l1Id of level1) {
    const l1Interactions = interactions.filter(
      (ix) => ix.from_user.id === l1Id || ix.to_user.id === l1Id
    )
    const candidates: number[] = []
    for (const ix of l1Interactions) {
      const other = ix.from_user.id === l1Id ? ix.to_user.id : ix.from_user.id
      if (!level2Ids.has(other) && !candidates.includes(other)) {
        candidates.push(other)
      }
      if (candidates.length >= MAX_LEVEL2_PER) break
    }
    candidates.forEach((id) => level2Ids.add(id))
    level2Map.set(l1Id, candidates)
  }

  // Build nodes
  const nodes = [
    { id: centerId, nickname: `用户_${centerId}`, avatar_url: '', level: 0, symbolSize: 70 },
  ]
  level1.forEach((id) => {
    nodes.push({ id, nickname: `用户_${id}`, avatar_url: '', level: 1, symbolSize: 48 })
  })
  for (const [l1Id, children] of level2Map) {
    children.forEach((id) => {
      if (!nodes.some((n) => n.id === id)) {
        nodes.push({ id, nickname: `用户_${id}`, avatar_url: '', level: 2, symbolSize: 32 })
      }
    })
  }

  // Build edges
  const edges: { source: number; target: number }[] = []
  level1.forEach((id) => {
    edges.push({ source: centerId, target: id })
  })
  for (const [l1Id, children] of level2Map) {
    children.forEach((childId) => {
      edges.push({ source: l1Id, target: childId })
    })
  }

  return { nodes, edges }
}

export default [
  {
    url: /\/api\/admin\/users\/(\d+)\/network$/,
    method: 'get',
    response: ({ url }: { url: string }) => {
      const id = Number(url.match(/\/api\/admin\/users\/(\d+)\/network$/)?.[1])
      return { code: 200, message: 'success', data: getNetwork(id) }
    },
  },
] as MockMethod[]
