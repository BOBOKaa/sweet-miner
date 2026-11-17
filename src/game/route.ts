import type { LevelItem } from './levels'
import {
  blocker,
  candyHits,
  clockBonus,
  makeScene,
  payout,
  reachOf,
  shotSeconds,
  type Body,
} from './physics'
import { STATS } from './tuning'

const scene = makeScene(120)

type SimBody = Body & { rolled: number }

export type Route = {
  score: number
  time: number
  budget: number
  steps: string[]
}

export type RouteLevel = {
  time: number
  period: number
  items: LevelItem[]
}

function toBodies(items: LevelItem[]): SimBody[] {
  return items.map((item, id) => ({
    type: item.type,
    nx: item.x,
    ny: item.y,
    r: STATS[item.type].r,
    phase: id * 0.7,
    gone: false,
    rolled: item.type === 'bag' ? 180 : 0,
  }))
}

function virtualValue(body: SimBody, items: SimBody[]): number {
  if (body.type === 'rockS' || body.type === 'rockL') return -1
  if (body.type === 'clock') return 80
  if (body.type === 'candy') {
    let bonus = payout('candy', 0, false)
    for (const rock of candyHits(scene, body, items, 0)) {
      const freed = items.some((item) => !item.gone && item !== rock && blocker(scene, item, items, 0) === rock)
      if (freed) bonus += 220
      else bonus += 20
    }
    return bonus
  }
  return payout(body.type, body.rolled, false)
}

/** Greedy no-upgrade route. Used both to audit levels and to price generated ones. */
export function simulateLevel(level: RouteLevel): Route {
  const items = toBodies(level.items)
  let score = 0
  let time = 0
  let budget = level.time
  const steps: string[] = []

  for (let guard = 0; guard < 80; guard++) {
    const open = items.filter((item) => !item.gone && !blocker(scene, item, items, 0))
    let best: { item: SimBody; value: number; cost: number; ratio: number } | null = null
    for (const item of open) {
      const value = virtualValue(item, items)
      if (value < 0) continue
      const reach = reachOf(scene, item, 0)
      if (!reach.reachable) continue
      const cost = shotSeconds(reach.dist, STATS[item.type].weight, level.period, false)
      const ratio = value / Math.max(0.4, cost)
      if (!best || ratio > best.ratio) best = { item, value, cost, ratio }
    }
    if (!best) break
    if (time + best.cost > budget + 0.01 && best.item.type !== 'clock') break
    time += best.cost
    best.item.gone = true
    if (best.item.type === 'clock') {
      budget += clockBonus()
      steps.push(`clock +${clockBonus()}s (${time.toFixed(1)}s)`)
    } else if (best.item.type === 'candy') {
      const rocks = candyHits(scene, best.item, items, 0)
      for (const rock of rocks) rock.gone = true
      score += payout('candy', 0, false)
      steps.push(`candy cleared ${rocks.length} (${time.toFixed(1)}s) score ${score}`)
    } else {
      score += payout(best.item.type, best.item.rolled, false)
      steps.push(`${best.item.type} +${payout(best.item.type, best.item.rolled, false)} (${time.toFixed(1)}s) score ${score}`)
    }
  }

  return { score, time, budget, steps }
}
