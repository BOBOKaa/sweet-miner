import {
  AMP,
  CANDY_RADIUS,
  CLOCK_BONUS,
  CLOVER_MUL,
  EXTEND_SPEED,
  GROUND_PAD,
  HOOK_R,
  ORIGIN_X,
  PLAY_GAP,
  PLAY_HEIGHT,
  PLAY_LEFT,
  PLAY_RIGHT,
  REST_LEN,
  RETRACT_SPEED,
  STAR_AMP,
  STATS,
  type ItemType,
} from './tuning'

export type Scene = {
  originX: number
  originY: number
  playLeft: number
  playRight: number
  playTop: number
  playHeight: number
  groundY: number
}

export function makeScene(originY: number, playHeight = PLAY_HEIGHT): Scene {
  const playTop = originY + PLAY_GAP
  return {
    originX: ORIGIN_X,
    originY,
    playLeft: PLAY_LEFT,
    playRight: PLAY_RIGHT,
    playTop,
    playHeight,
    groundY: playTop + playHeight + GROUND_PAD,
  }
}

export const CANON_SCENE = makeScene(120)

export type Body = {
  type: ItemType
  nx: number
  ny: number
  r: number
  phase: number
  gone?: boolean
}

export function itemPoint(scene: Scene, item: Body, now = 0): { x: number; y: number } {
  const span = scene.playRight - scene.playLeft
  let x = scene.playLeft + item.nx * span
  const y = scene.playTop + item.ny * scene.playHeight + Math.sin(now * 2.05 + item.phase) * 2.1
  if (item.type === 'star') x += Math.sin(now * 1.25 + item.phase) * STAR_AMP
  return { x, y }
}

export function ropeTip(scene: Scene, angle: number, length: number): { x: number; y: number } {
  return {
    x: scene.originX + Math.sin(angle) * length,
    y: scene.originY + Math.cos(angle) * length,
  }
}

export function maxRope(scene: Scene, angle: number): number {
  const dx = Math.sin(angle)
  const dy = Math.cos(angle)
  let maxL = 900
  const left = scene.playLeft + 4
  const right = scene.playRight - 4
  if (dx > 0.001) maxL = Math.min(maxL, (right - scene.originX) / dx)
  if (dx < -0.001) maxL = Math.min(maxL, (left - scene.originX) / dx)
  if (dy > 0.001) maxL = Math.min(maxL, (scene.groundY - scene.originY) / dy)
  return Math.max(REST_SAFE, maxL)
}

const REST_SAFE = 48

export function angleOf(scene: Scene, x: number, y: number): number {
  return Math.atan2(x - scene.originX, y - scene.originY)
}

export function payout(type: ItemType, rolled: number, clover: boolean): number {
  if (type === 'clock') return 0
  const base = type === 'bag' ? rolled : STATS[type].value
  return clover ? Math.round(base * CLOVER_MUL) : base
}

export function shotSeconds(dist: number, weight: number, period: number, strength = false): number {
  const extend = dist / EXTEND_SPEED
  const pull = RETRACT_SPEED * (strength ? 1.82 : 1)
  const retract = dist / (pull / Math.max(0.35, weight))
  return extend + retract + period * 0.18
}

export type Reach = {
  x: number
  y: number
  angle: number
  dist: number
  reachable: boolean
  reason: string
}

export function reachOf(scene: Scene, item: Body, now = 0): Reach {
  const p = itemPoint(scene, item, now)
  const angle = angleOf(scene, p.x, p.y)
  const dist = Math.hypot(p.x - scene.originX, p.y - scene.originY)
  const limit = maxRope(scene, angle)
  let reason = 'ok'
  let reachable = true
  if (Math.abs(angle) > AMP - 0.035) {
    reachable = false
    reason = 'angle'
  } else if (dist < item.r + REST_LEN + 14) {
    reachable = false
    reason = 'too-close'
  } else if (dist - item.r > limit - 3) {
    reachable = false
    reason = 'wall'
  }
  return { x: p.x, y: p.y, angle, dist, reachable, reason }
}

/** First other body the hook would meet on the way to `item`. */
export function blocker(scene: Scene, item: Body, items: Body[], now = 0): Body | null {
  const p = itemPoint(scene, item, now)
  const ang = angleOf(scene, p.x, p.y)
  const dx = Math.sin(ang)
  const dy = Math.cos(ang)
  const dist = Math.hypot(p.x - scene.originX, p.y - scene.originY)
  let best: { t: number; body: Body } | null = null
  for (const other of items) {
    if (other === item || other.gone) continue
    const o = itemPoint(scene, other, now)
    const ox = o.x - scene.originX
    const oy = o.y - scene.originY
    const t = ox * dx + oy * dy
    if (t <= 24 || t >= dist - other.r * 0.2) continue
    const px = dx * t
    const py = dy * t
    const dd = (ox - px) ** 2 + (oy - py) ** 2
    const rad = other.r + HOOK_R * 0.55
    if (dd <= rad * rad && (!best || t < best.t)) best = { t, body: other }
  }
  return best?.body ?? null
}

export function candyHits(scene: Scene, candy: Body, items: Body[], now = 0): Body[] {
  const c = itemPoint(scene, candy, now)
  const hits: Body[] = []
  for (const other of items) {
    if (other.gone || other === candy) continue
    if (other.type !== 'rockS' && other.type !== 'rockL') continue
    const o = itemPoint(scene, other, now)
    if (Math.hypot(o.x - c.x, o.y - c.y) <= CANDY_RADIUS + other.r * 0.25) hits.push(other)
  }
  return hits
}

export function clockBonus(): number {
  return CLOCK_BONUS
}
