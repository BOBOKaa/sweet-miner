import { LEVELS, type LevelItem } from './levels'
import { makeScene, reachOf, type Body } from './physics'
import { simulateLevel, type Route } from './route'
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

export type { Route }

export function simulate(levelIndex: number): Route {
  const level = LEVELS[levelIndex]
  return simulateLevel(level)
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
  let cumulative = 0
  const sims = LEVELS.map((_, index) => simulate(index))
  LEVELS.forEach((level, i) => {
    cumulative += level.target
    const sim = sims[i]
    const timeBad = sim.time > level.time
    const scoreBad = sim.score < level.target
    const next = LEVELS[i + 1]
    const surplus = sim.score - level.target
    const carryBad = Boolean(next && next.target <= surplus)
    if (timeBad || scoreBad || carryBad) failed = true
    const flag = timeBad || scoreBad || carryBad ? 'FAIL' : 'OK'
    lines.push(
      `${flag} L${i + 1} ${level.name} sim ${sim.score}/need ${level.target} (total ${cumulative}) in ${sim.time.toFixed(1)}s / ${level.time}s (budget after clocks ${sim.budget})`,
    )
    if (timeBad || scoreBad || carryBad) lines.push(`  ${sim.steps.join(' | ')}`)
    if (carryBad) lines.push(`  full clear surplus ${surplus} already covers next need ${next?.target}`)
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
