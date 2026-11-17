import type { LevelDef, LevelItem } from './levels'
import { blocker, candyHits, makeScene, reachOf, type Body } from './physics'
import { simulateLevel } from './route'
import { STAR_AMP, STATS, type ItemType } from './tuning'

const scene = makeScene(120)
export const CAMPAIGN_LENGTH = 100

const TINTS = [
  '珍珠',
  '蜂蜜',
  '葡萄',
  '椰子',
  '焦糖',
  '杏仁',
  '柚子',
  '奶霜',
  '青提',
  '水蜜',
  '荔枝',
  '芒果',
  '香芋',
  '抹茶',
  '可可',
  '樱糖',
  '桃胶',
  '桂花',
  '银耳',
  '奶盖',
]

const PLACES = ['云阶', '花廊', '甜井', '星阶', '王冠厅']

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function climb(index: number): number {
  return (index - 10) / 89
}

function bodyAt(item: LevelItem, id: number): Body {
  return {
    type: item.type,
    nx: item.x,
    ny: item.y,
    r: STATS[item.type].r,
    phase: id * 0.7,
  }
}

function separated(items: LevelItem[], candidate: LevelItem, gap: number): boolean {
  const next = bodyAt(candidate, items.length)
  const reach = reachOf(scene, next, 0)
  if (!reach.reachable) return false
  for (let i = 0; i < items.length; i++) {
    const other = items[i]
    const there = reachOf(scene, bodyAt(other, i), 0)
    const distance = Math.hypot(reach.x - there.x, reach.y - there.y)
    let need = STATS[candidate.type].r + STATS[other.type].r + gap
    if (candidate.type === 'star' || other.type === 'star') need += STAR_AMP
    if (distance < need) return false
  }
  return true
}

function place(items: LevelItem[], type: ItemType, x: number, y: number, gap: number): boolean {
  const candidate = {
    type,
    x: Math.min(0.93, Math.max(0.07, x)),
    y: Math.min(0.93, Math.max(0.15, y)),
  }
  if (!separated(items, candidate, gap)) return false
  items.push(candidate)
  return true
}

function placeRandom(
  items: LevelItem[],
  type: ItemType,
  rand: () => number,
  gap: number,
  bias: 'any' | 'deep' | 'high' | 'edge',
): boolean {
  for (let attempt = 0; attempt < 80; attempt++) {
    let x = 0.1 + rand() * 0.8
    let y = 0.16 + rand() * 0.74
    if (bias === 'deep') y = 0.6 + rand() * 0.32
    if (bias === 'high') y = 0.15 + rand() * 0.24
    if (bias === 'edge') {
      x = rand() < 0.5 ? 0.08 + rand() * 0.14 : 0.78 + rand() * 0.14
      y = 0.45 + rand() * 0.42
    }
    if (place(items, type, x, y, gap)) return true
  }
  return false
}

function haul(items: LevelItem[], period: number): number {
  return simulateLevel({ time: 300, period, items }).score
}

function blocksAny(bodies: Body[], rock: Body, kinds: ItemType[]): boolean {
  return bodies.some((item) => item !== rock && kinds.includes(item.type) && blocker(scene, item, bodies, 0) === rock)
}

function floorTargetFor(index: number): number {
  return Math.round((4300 + climb(index) * 1900) / 10) * 10
}

function layout(index: number, salt: number): { items: LevelItem[]; period: number } | null {
  const t = climb(index)
  const rand = mulberry32(0x5e57a1 + index * 997 + salt * 131)
  const gap = 8 + (1 - t) * 5
  const period = Math.round((2.4 - t * 0.42) * 100) / 100
  const quota = Math.round(floorTargetFor(index) / 0.78 / 10) * 10
  const items: LevelItem[] = []

  placeRandom(items, 'goldS', rand, gap, 'high')
  placeRandom(items, 'goldS', rand, gap, 'high')
  placeRandom(items, 'goldM', rand, gap, 'high')
  placeRandom(items, 'goldM', rand, gap, 'any')
  const heavies = 1 + Math.round(t * 3)
  for (let i = 0; i < heavies; i++) placeRandom(items, 'goldL', rand, gap, t > 0.4 ? 'deep' : 'any')

  let guard = 0
  while (haul(items, period) < quota && items.length < 18 && guard < 24) {
    guard += 1
    const gems = items.filter((item) => item.type === 'gem').length
    const type: ItemType = gems < 4 + Math.round(t * 5) ? 'gem' : guard % 4 === 0 ? 'star' : 'goldL'
    const bias = t > 0.5 && guard % 2 === 0 ? 'deep' : guard % 5 === 0 ? 'edge' : 'any'
    if (!placeRandom(items, type, rand, gap, bias)) break
  }
  if (!items.some((item) => item.type === 'bag')) placeRandom(items, 'bag', rand, gap, 'deep')
  if (haul(items, period) < quota) return null

  const rockCount = 1 + Math.round(t * 5)
  for (let i = 0; i < rockCount; i++) {
    const heavy = rand() < 0.25 + t * 0.55
    const before = items.length
    placeRandom(items, heavy ? 'rockL' : 'rockS', rand, gap, t > 0.5 ? 'deep' : 'any')
    if (items.length === before) continue
    const bodies = items.map((item, id) => bodyAt(item, id))
    const rock = bodies[bodies.length - 1]
    if (blocksAny(bodies, rock, ['goldS', 'goldM', 'gem', 'goldL', 'star', 'bag', 'clock', 'candy'])) items.pop()
  }

  if (t > 0.18) obstruct(items, gap, rand)
  if (haul(items, period) < quota) {
    let extra = 0
    while (haul(items, period) < quota && items.length < 18 && extra++ < 4) {
      placeRandom(items, extra % 2 === 0 ? 'gem' : 'goldL', rand, gap, 'any')
    }
  }
  if (haul(items, period) < quota) return null

  if (index % 4 !== 2) placeRandom(items, 'clock', rand, gap, t > 0.75 ? 'deep' : 'high')
  return { items, period }
}

function obstruct(items: LevelItem[], gap: number, rand: () => number): void {
  const prizes = items.filter((item) => item.type === 'gem' || item.type === 'goldL')
  if (!prizes.length) return
  const prize = prizes[Math.floor(rand() * prizes.length)]
  const prizeIndex = items.indexOf(prize)
  for (let attempt = 0; attempt < 10; attempt++) {
    const side = rand() < 0.5 ? -1 : 1
    const rock: LevelItem = {
      type: rand() < 0.6 ? 'rockL' : 'rockS',
      x: prize.x * (0.42 + rand() * 0.16) + 0.5 * (0.58 - rand() * 0.16),
      y: Math.max(0.2, prize.y * (0.38 + rand() * 0.18)),
    }
    if (!separated(items, rock, gap)) continue
    items.push(rock)
    const withRock = items.map((item, id) => bodyAt(item, id))
    const rockBody = withRock[withRock.length - 1]
    const blocksPrize = blocker(scene, withRock[prizeIndex], withRock, 0) === rockBody
    const blocksEasy = blocksAny(withRock, rockBody, ['goldS', 'goldM'])
    if (!blocksPrize || blocksEasy) {
      items.pop()
      continue
    }
    const candy = {
      type: 'candy' as const,
      x: Math.min(0.92, Math.max(0.08, rock.x + side * (0.18 + rand() * 0.06))),
      y: Math.min(0.88, Math.max(0.18, rock.y + (rand() - 0.45) * 0.1)),
    }
    if (!separated(items, candy, gap)) {
      items.pop()
      continue
    }
    items.push(candy)
    const after = items.map((item, id) => bodyAt(item, id))
    const candyBody = after[after.length - 1]
    const rockNow = after[after.length - 2]
    const hits = candyHits(scene, candyBody, after, 0)
    if (blocker(scene, candyBody, after, 0) || !hits.includes(rockNow)) {
      items.pop()
      items.pop()
      continue
    }
    return
  }
}

function tune(items: LevelItem[], period: number, index: number): { time: number; target: number } | null {
  const t = climb(index)
  const full = simulateLevel({ time: 300, period, items })
  const floorTarget = floorTargetFor(index)
  const ratioTarget = Math.round((full.score * (0.76 + t * 0.14)) / 10) * 10
  const cap = Math.floor((full.score * 0.92) / 10) * 10
  if (cap < floorTarget) return null
  const target = Math.min(cap, Math.max(floorTarget, ratioTarget))

  const spare = 1.52 - t * 0.26
  let time = Math.max(36, Math.ceil(full.time * spare))
  let sim = simulateLevel({ time, period, items })
  let guard = 0
  while ((sim.score < target || sim.time > time + 0.01) && guard++ < 8) {
    time += 2
    sim = simulateLevel({ time, period, items })
  }
  if (sim.score < target || sim.time > time + 0.01) return null
  return { time, target }
}

function levelName(index: number): string {
  return `${TINTS[index % TINTS.length]}${PLACES[Math.floor(index / TINTS.length) % PLACES.length]}`
}

function makeLevel(index: number): LevelDef {
  for (let salt = 0; salt < 24; salt++) {
    const built = layout(index, salt)
    if (!built) continue
    const priced = tune(built.items, built.period, index)
    if (!priced) continue
    return {
      name: levelName(index),
      time: priced.time,
      target: priced.target,
      period: built.period,
      items: built.items,
    }
  }
  throw new Error(`第 ${index + 1} 关排不出能过的布局`)
}

export function extendCampaign(opening: LevelDef[]): LevelDef[] {
  if (opening.length < 1) throw new Error('开场关卡是空的')
  const levels = opening.slice()
  for (let index = opening.length; index < CAMPAIGN_LENGTH; index++) {
    levels.push(makeLevel(index))
  }
  if (levels.length !== CAMPAIGN_LENGTH) throw new Error(`关卡数是 ${levels.length}`)
  const names = new Set(levels.map((level) => level.name))
  if (names.size !== levels.length) throw new Error('关卡名字有重复')
  return levels
}
