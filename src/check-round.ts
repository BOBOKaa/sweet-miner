import { GameEngine, type ClearInfo } from './game/engine'
import { LEVELS } from './game/levels'
import { blocker, payout, reachOf, type Body, type Scene } from './game/physics'
import { resolveRound, type RoundEnd, type RoundState } from './game/round'
import { emptyBuffs, REST_LEN } from './game/tuning'

const target = 1150

function expect(name: string, state: RoundState, end: RoundEnd): void {
  const got = resolveRound(state)
  if (got !== end) throw new Error(`${name}: expected ${end}, got ${got}`)
}

expect('still mining under the target', { score: 800, target, timeLeft: 20, intro: 0, itemsLeft: 4 }, 'play')
expect(
  'target reached while items and time remain',
  { score: 1200, target, timeLeft: 18, intro: 0, itemsLeft: 3 },
  'play',
)
expect('exact target still continues', { score: target, target, timeLeft: 5, intro: 0, itemsLeft: 1 }, 'play')
expect(
  'cleared and the field is empty',
  { score: 1400, target, timeLeft: 12, intro: 0, itemsLeft: 0 },
  'win',
)
expect(
  'clock runs out after the target was met',
  { score: 1600, target, timeLeft: 0, intro: 0, itemsLeft: 2 },
  'win',
)
expect(
  'clock runs out on an empty cleared field',
  { score: 1600, target, timeLeft: 0, intro: 0, itemsLeft: 0 },
  'win',
)
expect('clock runs out short of the target', { score: 900, target, timeLeft: 0, intro: 0, itemsLeft: 3 }, 'lose')
expect(
  'empty field still fails when the target was missed',
  { score: 400, target, timeLeft: 0, intro: 0, itemsLeft: 0 },
  'lose',
)
expect(
  'intro does not end a cleared round early',
  { score: 1300, target, timeLeft: 40, intro: 0.2, itemsLeft: 2 },
  'play',
)

type OpenEngine = {
  update(dt: number): void
  intro: number
  timerOn: boolean
  timeLeft: number
  score: number
  phase: string
  cleared: boolean
  now: number
  angle: number
  length: number
  scene: Scene
  items: Body[]
}

function harness(): { engine: GameEngine; open: OpenEngine; wins: ClearInfo[]; losses: { n: number } } {
  const wins: ClearInfo[] = []
  const losses = { n: 0 }
  const canvas = { getContext: () => ({}) } as unknown as HTMLCanvasElement
  const engine = new GameEngine(canvas, {
    onHud: () => {},
    onWin: (info) => wins.push(info),
    onLose: () => {
      losses.n += 1
    },
    onBomb: () => {},
    play: () => {},
  })
  engine.startLevel(0, 0, emptyBuffs())
  const open = engine as unknown as OpenEngine
  open.intro = 0
  open.timerOn = false
  return { engine, open, wins, losses }
}

function step(open: OpenEngine, seconds: number): void {
  const frames = Math.ceil(seconds / 0.034)
  for (let i = 0; i < frames; i++) open.update(0.034)
}

function pullOne(open: OpenEngine, before?: () => void): number {
  const beforeScore = open.score
  let best: { item: Body; angle: number; value: number } | null = null
  for (const item of open.items) {
    if (item.gone || item.type === 'rockS' || item.type === 'rockL' || item.type === 'clock') continue
    const reach = reachOf(open.scene, item, open.now)
    if (!reach.reachable) continue
    if (blocker(open.scene, item, open.items, open.now)) continue
    const value = payout(item.type, 0, false)
    if (!best || value > best.value) best = { item, angle: reach.angle, value }
  }
  if (!best) throw new Error('no open prize to hook')
  open.phase = 'extend'
  open.angle = best.angle
  open.length = REST_LEN
  before?.()
  for (let i = 0; i < 500; i++) {
    open.update(0.034)
    if (open.phase === 'swing' || open.phase === 'win' || open.phase === 'lose') {
      return open.score - beforeScore
    }
  }
  throw new Error('hook never came home')
}

function finish(open: OpenEngine, wins: ClearInfo[]): ClearInfo {
  for (let i = 0; i < 40; i++) open.update(0.05)
  const info = wins.at(-1)
  if (!info) throw new Error('level did not resolve')
  return info
}

function playUntilClear(open: OpenEngine, wins: ClearInfo[]): void {
  for (let i = 0; i < 8 && !open.cleared; i++) pullOne(open)
  if (!open.cleared) throw new Error('score never reached the target')
  if (open.phase !== 'swing') throw new Error(`clearing the target ended the level (${open.phase})`)
  if (wins.length) throw new Error('result screen opened when the target was reached')
  if (open.items.every((item) => item.gone)) throw new Error('field was empty at the moment of clearing')
  if (!(open.timeLeft > 1)) throw new Error('timer was not still running after the clear')
}

const overtime = harness()
playUntilClear(overtime.open, overtime.wins)
const bankedAtClear = overtime.open.score
step(overtime.open, 0.4)
if (overtime.open.phase !== 'swing' || overtime.wins.length) throw new Error('overtime play was cut short')
if (!overtime.engine.shoot()) throw new Error('hook would not fire after the clear')
overtime.open.phase = 'swing'
overtime.open.timerOn = false
overtime.open.length = REST_LEN
const gained = pullOne(overtime.open, () => {
  overtime.open.timeLeft = 0
  overtime.open.timerOn = true
})
if (gained <= 0) throw new Error('the catch after clearing did not add score')
if (overtime.open.phase !== 'win') throw new Error('timer expiry after a clear did not win')
const won = finish(overtime.open, overtime.wins)
if (won.score !== bankedAtClear + gained) throw new Error(`won ${won.score}, expected ${bankedAtClear + gained}`)
if (won.bonus !== gained) throw new Error(`bonus ${won.bonus}, expected ${gained}`)
if (won.stars < 2) throw new Error(`stars were judged at the buzzer (${won.stars}), not when the target was met`)
if (overtime.losses.n) throw new Error('a cleared level took the fail path')

const emptied = harness()
playUntilClear(emptied.open, emptied.wins)
const timeLeft = emptied.open.timeLeft
for (const item of emptied.open.items) item.gone = true
emptied.open.update(0.034)
if (emptied.open.phase !== 'win') throw new Error('an empty cleared field kept the level open')
if (emptied.open.timeLeft !== timeLeft) throw new Error('empty-field win waited for the clock')
const emptiedWin = finish(emptied.open, emptied.wins)
if (emptiedWin.bonus !== 0) throw new Error('empty-field win invented bonus money')
if (emptiedWin.score < LEVELS[0].target) throw new Error('empty-field win dropped the score')
if (LEVELS.length !== 100) throw new Error(`expected 100 levels, got ${LEVELS.length}`)

const failed = harness()
failed.open.timeLeft = 0
failed.open.update(0.034)
if (failed.open.phase !== 'lose') throw new Error('missing the target did not fail when time ran out')
step(failed.open, 1)
if (failed.wins.length || failed.losses.n !== 1) throw new Error('fail path did not stay a retry')

console.log('ROUND OK')
