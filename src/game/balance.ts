import { LEVELS, type LevelItem } from './levels'
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

type SimBody = Body & { id: number; rolled: number }

function toBodies(items: LevelItem[]): SimBody[] {
  return items.map((item, id) => ({
    id,
    type: item.type,
    nx: item.x,
    ny: item.y,
    r: STATS[item.type].r,
    phase: id * 0.7,
    gone: false,
    rolled: item.type === 'bag' ? 180 : 0,
  }))
}

function overlaps(): string[] {
  const notes: string[] = []
  LEVELS.forEach((level, li) => {
    const bodies = toBodies(level.items)
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i]
      const pa = reachOf(scene, a, 0)
      if (!pa.reachable) {
        notes.push(`L${li + 1} ${a.type}@${i} unreachable (${pa.reason}) ang=${pa.angle.toFixed(2)} dist=${pa.dist.toFixed(0)}`)
      }
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j]
        const pb = reachOf(scene, b, 0)
        const d = Math.hypot(pa.x - pb.x, pa.y - pb.y)
        const need = a.r + b.r + 8
        if (d < need) {
          notes.push(`L${li + 1} overlap ${a.type}#${i} & ${b.type}#${j} gap=${(need - d).toFixed(1)}`)
        }
      }
    }
  })
  return notes
}

export type Route = {
  score: number
  time: number
  budget: number
  steps: string[]
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

export function simulate(levelIndex: number): Route {
  const level = LEVELS[levelIndex]
  const items = toBodies(level.items)
  let score = 0
  let time = 0
  let budget = level.time
  const steps: string[] = []

  for (let guard = 0; guard < 40; guard++) {
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

export function summarize(): string {
  const lines: string[] = []
  const problems = overlaps()
  if (problems.length) {
    lines.push('LAYOUT FAIL')
    lines.push(...problems)
  } else {
    lines.push('LAYOUT OK')
  }
  let failed = problems.length > 0
  LEVELS.forEach((level, i) => {
    const sim = simulate(i)
    const timeBad = sim.time > level.time
    const scoreBad = sim.score < level.target
    if (timeBad || scoreBad) failed = true
    const flag = timeBad || scoreBad ? 'FAIL' : 'OK'
    lines.push(
      `${flag} L${i + 1} ${level.name} sim ${sim.score}/${level.target} in ${sim.time.toFixed(1)}s / ${level.time}s (budget after clocks ${sim.budget})`,
    )
    if (timeBad || scoreBad) lines.push(`  ${sim.steps.join(' | ')}`)
  })
  if (failed) lines.unshift('BALANCE FAIL')
  else lines.unshift('BALANCE OK')
  return lines.join('\n')
}

export function suggestTargets(): string {
  return LEVELS.map((level, i) => {
    const sim = simulate(i)
    const target = Math.round((sim.score * 0.74) / 10) * 10
    const time = Math.max(level.time, Math.ceil(sim.time / 0.78))
    return `L${i + 1} ${level.name} suggest target ${target} (sim ${sim.score}) time ${time} (sim ${sim.time.toFixed(1)} / now ${level.time})`
  }).join('\n')
}
