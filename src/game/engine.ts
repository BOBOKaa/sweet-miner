import {
  drawWand,
  drawGirl,
  drawItem,
  drawMoodSparkles,
  drawRope,
  drawWinch,
  girlAnchorX,
  paintWorld,
  star4,
} from './art'
import { LEVELS } from './levels'
import { itemPoint, makeScene, maxRope, payout, ropeTip, type Scene } from './physics'
import { resolveRound } from './round'
import {
  AMP,
  BAG_TABLE,
  CANDY_RADIUS,
  CLOCK_BONUS,
  DW,
  EXTEND_SPEED,
  HOOK_R,
  ORIGIN_BELOW_HUD,
  PLAY_HEIGHT,
  REST_LEN,
  RETRACT_SPEED,
  STATS,
  STRENGTH_MUL,
  type Buffs,
  type ItemType,
  type Mood,
} from './tuning'

export type Phase = 'swing' | 'extend' | 'retract' | 'win' | 'lose'

export type SfxName = 'shoot' | 'gold' | 'gem' | 'rock' | 'coin' | 'clock' | 'bomb' | 'success' | 'fail' | 'tick'

export type HudSnapshot = {
  level: number
  name: string
  timeLeft: number
  score: number
  target: number
  bombs: number
  phase: Phase
  cleared: boolean
  holding: ItemType | null
  weight: number
  hint: string
  pills: string[]
}

export type ClearInfo = {
  level: number
  name: string
  score: number
  target: number
  timeLeft: number
  timeMax: number
  stars: number
  /** Money collected after the target was already met. */
  bonus: number
}

type Runtime = {
  type: ItemType
  nx: number
  ny: number
  r: number
  rot: number
  phase: number
  seed: number
  gone: boolean
  rolled: number
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  kind: 'dot' | 'star'
  g: number
}

type Popup = { x: number; y: number; text: string; life: number; max: number; color: string }
type Flyer = {
  type: ItemType
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  life: number
  r: number
  seed: number
}
type Mote = { x: number; y: number; r: number; v: number; tw: number }

export type EngineHooks = {
  onHud: (hud: HudSnapshot) => void
  onWin: (info: ClearInfo) => void
  onLose: (info: { score: number; target: number }) => void
  onBomb: (left: number) => void
  play: (name: SfxName) => void
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D
  private hooks: EngineHooks
  private raf = 0
  private running = false
  private last = 0
  private paused = false

  private viewW = 390
  private viewH = 700
  private dpr = 1
  private s = 1
  private ox = 0
  private designH = 700
  private hudH = 78
  private ctrlH = 112
  private scene: Scene = makeScene(120)
  private bg: HTMLCanvasElement | null = null
  private bgKey = ''

  private levelIndex = 0
  private items: Runtime[] = []
  private score = 0
  private timeLeft = 60
  private timeMax = 60
  private bombs = 0
  private strength = false
  private clover = false
  private extraTime = 0

  private phase: Phase = 'swing'
  private angle = 0
  private swingT = 0
  private length = REST_LEN
  private held: Runtime | null = null
  private claw = 1
  private boost = 0
  private now = 0
  private intro = 0
  private timerOn = false
  private shots = 0
  private mood: Mood = 'idle'
  private moodUntil = 0
  private rockHint = 0
  private winTimer = 0
  private loseTimer = 0
  private winSent = false
  private loseSent = false
  private cleared = false
  private clearStars = 1
  private clearScore = 0
  private lastTick = 99
  private shake = 0
  private particles: Particle[] = []
  private popups: Popup[] = []
  private flyers: Flyer[] = []
  private motes: Mote[] = []
  private trail: Array<{ x: number; y: number }> = []

  constructor(canvas: HTMLCanvasElement, hooks: EngineHooks) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建画布')
    this.ctx = ctx
    this.hooks = hooks
  }

  resize(viewW: number, viewH: number): void {
    if (viewW < 20 || viewH < 20) return
    this.viewW = viewW
    this.viewH = viewH
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    const canvas = this.ctx.canvas
    canvas.width = Math.round(viewW * this.dpr)
    canvas.height = Math.round(viewH * this.dpr)
    this.layout()
  }

  setInsets(hud: number, ctrl: number): void {
    this.hudH = hud
    this.ctrlH = ctrl
    this.layout()
  }

  setPaused(paused: boolean): void {
    this.paused = paused
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    const loop = (ts: number) => {
      if (!this.running) return
      const dt = Math.min(0.034, (ts - this.last) / 1000)
      this.last = ts
      if (!this.paused) this.update(dt)
      this.draw()
      this.hooks.onHud(this.snapshot())
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  startLevel(index: number, bombs: number, buffs: Buffs): void {
    const level = LEVELS[index]
    this.levelIndex = index
    this.bombs = bombs
    this.strength = buffs.strength
    this.clover = buffs.clover
    this.extraTime = buffs.extraTime
    this.score = 0
    this.timeMax = level.time + buffs.extraTime
    this.timeLeft = this.timeMax
    this.phase = 'swing'
    this.angle = 0
    this.swingT = Math.PI * 0.15
    this.length = REST_LEN
    this.held = null
    this.claw = 1
    this.boost = 0
    this.paused = false
    this.timerOn = false
    this.intro = 0.75
    this.shots = 0
    this.mood = 'idle'
    this.moodUntil = 0
    this.rockHint = 0
    this.winTimer = 0
    this.loseTimer = 0
    this.winSent = false
    this.loseSent = false
    this.cleared = false
    this.clearStars = 1
    this.clearScore = 0
    this.lastTick = Math.ceil(this.timeLeft)
    this.shake = 0
    this.particles = []
    this.popups = []
    this.flyers = []
    this.trail = []
    this.items = level.items.map((item, id) => ({
      type: item.type,
      nx: item.x,
      ny: item.y,
      r: STATS[item.type].r,
      rot: item.type === 'gem' || item.type === 'clock' || item.type === 'star' ? 0 : (id % 5) * 0.12 - 0.24,
      phase: id * 0.9,
      seed: id * 1.7 + 0.4,
      gone: false,
      rolled: item.type === 'bag' ? BAG_TABLE[Math.floor(Math.random() * BAG_TABLE.length)] : 0,
    }))
    this.motes = Array.from({ length: 10 }, (_, i) => ({
      x: 40 + ((i * 37) % 310),
      y: 220 + ((i * 53) % 260),
      r: 1.4 + (i % 3) * 0.6,
      v: 8 + (i % 4) * 3,
      tw: i,
    }))
    this.layout()
  }

  shoot(): boolean {
    if (this.paused || this.phase !== 'swing') return false
    this.phase = 'extend'
    this.timerOn = true
    this.shots += 1
    this.trail = []
    this.hooks.play('shoot')
    return true
  }

  tryBomb(): boolean {
    const held = this.held
    if (this.paused || this.phase !== 'retract' || !held) return false
    if (held.type !== 'rockS' && held.type !== 'rockL') return false
    if (this.bombs <= 0) return false
    this.bombs -= 1
    const p = this.heldPoint(held)
    this.flyers.push({
      type: held.type,
      x: p.x,
      y: p.y,
      vx: (Math.random() - 0.5) * 140,
      vy: -40,
      rot: held.rot,
      vr: (Math.random() - 0.5) * 6,
      life: 0.55,
      r: held.r,
      seed: held.seed,
    })
    held.gone = true
    this.held = null
    this.boost = 0.28
    this.mood = 'happy'
    this.moodUntil = this.now + 0.8
    this.burst(p.x, p.y, ['#F7A8C4', '#F6C453', '#FFFFFF', '#B7E6D4'], 16)
    this.shake = 0.12
    this.hooks.onBomb(this.bombs)
    this.hooks.play('bomb')
    return true
  }

  private layout(): void {
    const viewW = this.viewW
    const viewH = this.viewH
    let s = viewW / DW
    const needed = (scale: number) => {
      const originY = this.hudH / scale + ORIGIN_BELOW_HUD
      const ground = originY + 50 + PLAY_HEIGHT + 12
      return ground * scale + this.ctrlH + 8
    }
    if (needed(s) > viewH) s = Math.max(0.62, s * (viewH / needed(s)))
    const designH = viewH / s
    const hudD = this.hudH / s
    const ctrlD = this.ctrlH / s
    const originY = hudD + ORIGIN_BELOW_HUD
    let playHeight = PLAY_HEIGHT
    let scene = makeScene(originY, playHeight)
    const limit = designH - ctrlD - 4
    if (scene.groundY > limit) {
      playHeight = Math.max(230, playHeight - (scene.groundY - limit))
      scene = makeScene(originY, playHeight)
    }
    this.s = s
    this.ox = (viewW - DW * s) / 2
    this.designH = designH
    this.scene = scene
  }

  private update(dt: number): void {
    this.now += dt
    if (this.shake > 0) this.shake -= dt
    if (this.rockHint > 0) this.rockHint -= dt
    this.updateFx(dt)

    if (this.phase === 'win') {
      this.winTimer -= dt
      if (this.winTimer <= 0 && !this.winSent) {
        this.winSent = true
        const level = LEVELS[this.levelIndex]
        this.hooks.onWin({
          level: this.levelIndex + 1,
          name: level.name,
          score: this.score,
          target: level.target,
          timeLeft: Math.max(0, this.timeLeft),
          timeMax: this.timeMax,
          stars: this.clearStars,
          bonus: Math.max(0, this.score - this.clearScore),
        })
      }
      return
    }
    if (this.phase === 'lose') {
      this.loseTimer -= dt
      if (this.loseTimer <= 0 && !this.loseSent) {
        this.loseSent = true
        this.hooks.onLose({ score: this.score, target: LEVELS[this.levelIndex].target })
      }
      return
    }

    if (this.intro > 0) {
      this.intro -= dt
      if (this.intro <= 0) this.timerOn = true
    }
    if (this.timerOn) {
      this.timeLeft -= dt
      if (this.timeLeft < 0) this.timeLeft = 0
      const sec = Math.ceil(this.timeLeft)
      if (sec <= 10 && sec >= 1 && sec < this.lastTick) this.hooks.play('tick')
      this.lastTick = sec
    }

    const level = LEVELS[this.levelIndex]
    if (this.phase === 'swing') {
      this.swingT += dt
      this.angle = Math.sin((this.swingT / level.period) * Math.PI * 2) * AMP
      this.length = REST_LEN
      this.trail = []
      if (this.now > this.moodUntil) this.mood = 'idle'
    } else if (this.phase === 'extend') {
      const prev = this.length
      const cap = maxRope(this.scene, this.angle)
      this.length = Math.min(cap, this.length + EXTEND_SPEED * dt)
      const tip = ropeTip(this.scene, this.angle, this.length)
      this.trail.push(tip)
      if (this.trail.length > 7) this.trail.shift()
      const hit = this.hitTest(prev, this.length)
      if (hit) {
        this.length = hit.dist
        this.grab(hit.item)
      } else if (this.length >= cap - 0.4) {
        this.length = cap
        this.phase = 'retract'
        this.burst(tip.x, tip.y, ['#FFFFFF', '#FFD6E6'], 7)
      }
    } else if (this.phase === 'retract') {
      const weight = this.held ? STATS[this.held.type].weight : 0.7
      let speed = (RETRACT_SPEED / weight) * (this.strength ? STRENGTH_MUL : 1)
      if (this.boost > 0) {
        speed *= 1.75
        this.boost -= dt
      }
      this.length -= speed * dt
      if (this.trail.length) this.trail.shift()
      if (this.length <= REST_LEN) {
        this.length = REST_LEN
        if (this.held) this.collect(this.held)
        this.held = null
        this.phase = 'swing'
      }
    }

    const openTarget = this.phase === 'retract' && this.held ? 0.04 : 1
    this.claw += (openTarget - this.claw) * Math.min(1, dt * 14)

    if (this.phase === 'swing') this.maybeFinishLevel()

    for (const mote of this.motes) {
      mote.y -= mote.v * dt
      if (mote.y < this.scene.playTop - 10) mote.y = this.scene.groundY - 8
    }
  }

  private grab(item: Runtime): void {
    this.held = item
    this.phase = 'retract'
    const p = itemPoint(this.scene, item, this.now)
    if (item.type === 'gem' || item.type === 'star') {
      this.mood = 'wow'
      this.hooks.play('gem')
      this.burst(p.x, p.y, ['#FFFFFF', '#F6C6FF', '#F2C14E', '#B7E6D4'], 16)
    } else if (item.type === 'rockS' || item.type === 'rockL') {
      this.mood = 'pout'
      this.hooks.play('rock')
      this.rockHint = 2.8
      this.burst(p.x, p.y, ['#E7D5DC', '#FFFFFF'], 8)
    } else if (item.type === 'goldL') {
      this.mood = 'effort'
      this.hooks.play('gold')
      this.burst(p.x, p.y, ['#FFF1C2', '#F2C14E', '#FFFFFF'], 12)
    } else if (item.type === 'clock') {
      this.mood = 'happy'
      this.hooks.play('clock')
      this.burst(p.x, p.y, ['#B7E6D4', '#FFFFFF', '#F7A8C4'], 10)
    } else {
      this.mood = 'happy'
      this.hooks.play('gold')
      this.burst(p.x, p.y, ['#FFF1C2', '#F2C14E', '#FFFFFF', '#F7A8C4'], 11)
    }
    this.moodUntil = this.now + 1.25
  }

  private collect(item: Runtime): void {
    item.gone = true
    const spot = ropeTip(this.scene, this.angle, REST_LEN + 10)
    if (item.type === 'clock') {
      this.timeLeft += CLOCK_BONUS
      this.timeMax += CLOCK_BONUS
      this.popup(spot.x, spot.y, '+8秒', '#2F9D86')
    } else {
      const value = payout(item.type, item.rolled, this.clover)
      this.score += value
      this.popup(spot.x, spot.y, `+${value}`, popupColor(item.type))
      this.hooks.play('coin')
      if (item.type === 'candy') this.blastCandy(item)
      if (item.type === 'gem' || item.type === 'goldL') this.shake = item.type === 'gem' ? 0.2 : 0.12
    }
    this.burst(spot.x, spot.y, ['#FFF6D4', '#F7A8C4', '#FFFFFF'], 8)
  }

  private blastCandy(item: Runtime): void {
    const origin = itemPoint(this.scene, item, 0)
    let n = 0
    for (const other of this.items) {
      if (other.gone) continue
      if (other.type !== 'rockS' && other.type !== 'rockL') continue
      const p = itemPoint(this.scene, other, this.now)
      if (Math.hypot(p.x - origin.x, p.y - origin.y) <= CANDY_RADIUS) {
        other.gone = true
        this.burst(p.x, p.y, ['#E7D5DC', '#FFFFFF', '#F7A8C4'], 8)
        n += 1
      }
    }
    if (n > 0) {
      const spot = ropeTip(this.scene, this.angle, REST_LEN + 28)
      this.popup(spot.x, spot.y + 18, '石头飞走啦', '#E46B96')
    }
  }

  private maybeFinishLevel(): void {
    if (this.intro > 0) return
    const level = LEVELS[this.levelIndex]
    const itemsLeft = this.items.reduce((count, item) => count + (item.gone ? 0 : 1), 0)
    const end = resolveRound({
      score: this.score,
      target: level.target,
      timeLeft: this.timeLeft,
      intro: this.intro,
      itemsLeft,
    })
    if (end === 'play') {
      if (this.score >= level.target) this.markCleared()
      return
    }
    if (end === 'win') this.beginWin()
    else this.beginLose()
  }

  private markCleared(): void {
    if (this.cleared) return
    this.cleared = true
    this.clearStars = starCount(this.timeLeft, this.timeMax)
    this.clearScore = this.score
    const spot = ropeTip(this.scene, this.angle, REST_LEN + 36)
    this.popup(spot.x, spot.y, '过关啦', '#E46B96')
    this.burst(spot.x, spot.y, ['#F7A8C4', '#F6C453', '#FFFFFF', '#B7E6D4'], 16)
  }

  private beginWin(): void {
    if (!this.cleared) {
      this.cleared = true
      this.clearStars = starCount(this.timeLeft, this.timeMax)
      this.clearScore = this.score
    }
    this.phase = 'win'
    this.timerOn = false
    this.winTimer = 0.85
    this.mood = 'wow'
    this.moodUntil = this.now + 2
    this.hooks.play('success')
    this.confetti()
  }

  private beginLose(): void {
    this.phase = 'lose'
    this.timerOn = false
    this.loseTimer = 0.4
    this.mood = 'pout'
    this.moodUntil = this.now + 2
    this.hooks.play('fail')
  }

  private hitTest(prev: number, next: number): { item: Runtime; dist: number } | null {
    const dx = Math.sin(this.angle)
    const dy = Math.cos(this.angle)
    let best: { item: Runtime; dist: number } | null = null
    for (const item of this.items) {
      if (item.gone || item === this.held) continue
      const p = itemPoint(this.scene, item, this.now)
      const ox = p.x - this.scene.originX
      const oy = p.y - this.scene.originY
      const t = ox * dx + oy * dy
      const rad = item.r + HOOK_R * 0.65
      if (t <= 16) continue
      const px = dx * t
      const py = dy * t
      const dd = (ox - px) ** 2 + (oy - py) ** 2
      if (dd > rad * rad) continue
      const touch = t - Math.sqrt(Math.max(0, rad * rad - dd))
      if (touch <= next + 0.5 && touch >= prev - rad) {
        const dist = Math.max(REST_LEN, touch)
        if (!best || dist < best.dist) best = { item, dist }
      }
    }
    return best
  }

  private heldPoint(item: Runtime): { x: number; y: number } {
    const extra = Math.min(18, item.r * 0.55)
    return ropeTip(this.scene, this.angle, this.length + extra)
  }

  private snapshot(): HudSnapshot {
    const level = LEVELS[this.levelIndex]
    const holding = this.held?.type ?? null
    let hint = ''
    if (this.levelIndex === 0 && this.shots === 0 && this.phase === 'swing') {
      hint = '仙女棒在摇摆，点屏幕或爱心发射'
    } else if (this.rockHint > 0 && holding && (holding === 'rockS' || holding === 'rockL')) {
      hint = this.bombs > 0 ? '点左边的小炸弹，把石头松开' : '石头好重，小铺里可以买小炸弹'
    }
    const pills: string[] = []
    if (this.strength) pills.push('汽水')
    if (this.clover) pills.push('幸运 ×1.5')
    if (this.extraTime) pills.push(`沙漏 +${this.extraTime}秒`)
    return {
      level: this.levelIndex + 1,
      name: level.name,
      timeLeft: Math.max(0, this.timeLeft),
      score: this.score,
      target: level.target,
      bombs: this.bombs,
      phase: this.phase,
      cleared: this.cleared,
      holding,
      weight: holding ? STATS[holding].weight : 0,
      hint,
      pills,
    }
  }

  private draw(): void {
    const ctx = this.ctx
    const dpr = this.dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = true
    const wash = ctx.createLinearGradient(0, 0, 0, this.viewH)
    wash.addColorStop(0, '#FFF5F9')
    wash.addColorStop(0.45, '#F7D9EC')
    wash.addColorStop(1, '#FDE6D8')
    ctx.fillStyle = wash
    ctx.fillRect(0, 0, this.viewW, this.viewH)

    ctx.setTransform(dpr * this.s, 0, 0, dpr * this.s, dpr * this.ox, 0)
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3)
    this.blitWorld(ctx)

    for (const mote of this.motes) {
      const a = 0.25 + Math.sin(this.now * 2 + mote.tw) * 0.15
      ctx.globalAlpha = a
      ctx.fillStyle = '#FFFFFF'
      star4(ctx, mote.x, mote.y, mote.r + 1.5)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    if (this.levelIndex === 0 && this.shots === 0 && this.phase === 'swing') {
      const tip = ropeTip(this.scene, this.angle, 210)
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.setLineDash([5, 7])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(this.scene.originX, this.scene.originY)
      ctx.lineTo(tip.x, tip.y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    const drawable = this.items.filter((item) => !item.gone && item !== this.held)
    drawable.sort((a, b) => a.ny - b.ny)
    for (const item of drawable) {
      const p = itemPoint(this.scene, item, this.now)
      const spin = item.type === 'star' ? Math.sin(this.now * 1.5 + item.phase) * 0.2 : item.rot
      drawItem(ctx, item.type, p.x, p.y, item.r, spin, item.seed, this.now)
    }

    const feetX = girlAnchorX()
    const feetY = this.scene.originY + 6
    ctx.save()
    ctx.translate(feetX, feetY)
    const blink = this.mood === 'idle' && this.now % 3.8 > 3.62
    drawGirl(ctx, this.mood, blink)
    ctx.restore()
    drawMoodSparkles(ctx, feetX, feetY, this.now, this.mood)

    const tip = ropeTip(this.scene, this.angle, this.length)
    this.trail.forEach((p, i) => {
      ctx.globalAlpha = ((i + 1) / (this.trail.length + 1)) * 0.45
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    drawRope(ctx, this.scene.originX, this.scene.originY, tip.x, tip.y)
    if (this.held && STATS[this.held.type].weight >= 2.8 && this.phase === 'retract') {
      this.drawStrain(ctx, tip.x, tip.y)
    }

    ctx.save()
    ctx.translate(tip.x, tip.y)
    ctx.rotate(-this.angle)
    drawWand(ctx, this.claw, this.now)
    ctx.restore()

    if (this.held) {
      const p = this.heldPoint(this.held)
      const wob = Math.sin(this.now * 14) * 0.08
      drawItem(ctx, this.held.type, p.x, p.y, this.held.r, this.held.rot + wob, this.held.seed, this.now)
    }

    drawWinch(ctx, this.scene)

    for (const flyer of this.flyers) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, flyer.life / 0.55)
      drawItem(ctx, flyer.type, flyer.x, flyer.y, flyer.r, flyer.rot, flyer.seed, this.now)
      ctx.restore()
    }
    ctx.globalAlpha = 1

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.max)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      if (p.kind === 'star') star4(ctx, p.x, p.y, p.size)
      else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      }
      ctx.fill()
    }
    ctx.globalAlpha = 1

    ctx.font = '22px "ZCOOL KuaiLe", "PingFang SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.lineJoin = 'round'
    for (const pop of this.popups) {
      ctx.globalAlpha = Math.max(0, Math.min(1, pop.life / 0.3))
      ctx.lineWidth = 5
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      ctx.strokeText(pop.text, pop.x, pop.y)
      ctx.fillStyle = pop.color
      ctx.fillText(pop.text, pop.x, pop.y)
    }
    ctx.globalAlpha = 1
  }

  private blitWorld(ctx: CanvasRenderingContext2D): void {
    const key = `${Math.round(this.scene.originY)}|${Math.round(this.scene.groundY)}|${Math.round(this.designH)}`
    if (!this.bg || this.bgKey !== key) {
      const canvas = document.createElement('canvas')
      const h = Math.max(1, Math.ceil(this.designH))
      canvas.width = DW * 2
      canvas.height = h * 2
      const g = canvas.getContext('2d')
      if (!g) return
      g.scale(2, 2)
      paintWorld(g, this.scene, this.designH)
      this.bg = canvas
      this.bgKey = key
    }
    ctx.drawImage(this.bg, 0, 0, DW, Math.ceil(this.designH))
  }

  private drawStrain(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const nx = Math.cos(this.angle)
    const ny = -Math.sin(this.angle)
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * 8
      ctx.beginPath()
      ctx.moveTo(x + nx * o, y + ny * o)
      ctx.lineTo(x + nx * o + Math.sin(this.angle) * 14, y + ny * o + Math.cos(this.angle) * 14)
      ctx.stroke()
    }
  }

  private burst(x: number, y: number, colors: string[], n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 28 + Math.random() * 90
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 16,
        life: 0.45 + Math.random() * 0.35,
        max: 0.8,
        color: colors[i % colors.length] ?? '#fff',
        size: 2 + Math.random() * 2.6,
        kind: Math.random() > 0.62 ? 'star' : 'dot',
        g: 70,
      })
    }
    if (this.particles.length > 110) this.particles.splice(0, this.particles.length - 110)
  }

  private confetti(): void {
    const colors = ['#F7A8C4', '#F2C14E', '#B7E6D4', '#E6C6FF', '#FFFFFF', '#FFD0E2']
    for (let i = 0; i < 42; i++) {
      this.particles.push({
        x: 30 + Math.random() * 330,
        y: this.scene.originY - 20 + Math.random() * 30,
        vx: (Math.random() - 0.5) * 80,
        vy: 40 + Math.random() * 90,
        life: 0.9 + Math.random() * 0.6,
        max: 1.4,
        color: colors[i % colors.length] ?? '#fff',
        size: 2.5 + Math.random() * 2.5,
        kind: i % 3 === 0 ? 'star' : 'dot',
        g: 40,
      })
    }
  }

  private popup(x: number, y: number, text: string, color: string): void {
    this.popups.push({
      x: x + (Math.random() - 0.5) * 16,
      y,
      text,
      life: 1.05,
      max: 1.05,
      color,
    })
  }

  private updateFx(dt: number): void {
    for (const p of this.particles) {
      p.vy += p.g * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const pop of this.popups) {
      pop.y -= 28 * dt
      pop.life -= dt
    }
    this.popups = this.popups.filter((p) => p.life > 0)
    for (const f of this.flyers) {
      f.vy += 280 * dt
      f.x += f.vx * dt
      f.y += f.vy * dt
      f.rot += f.vr * dt
      f.life -= dt
    }
    this.flyers = this.flyers.filter((f) => f.life > 0)
  }
}

function starCount(timeLeft: number, timeMax: number): number {
  const ratio = timeMax <= 0 ? 0 : Math.max(0, timeLeft) / timeMax
  if (ratio >= 0.34) return 3
  if (ratio >= 0.14) return 2
  return 1
}

function popupColor(type: ItemType): string {
  if (type === 'gem' || type === 'star') return '#B14EC8'
  if (type === 'rockS' || type === 'rockL') return '#8D7380'
  if (type === 'clock') return '#2F9D86'
  if (type === 'candy') return '#E46B96'
  return '#D4891A'
}
