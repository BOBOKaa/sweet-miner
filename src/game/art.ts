import type { Scene } from './physics'
import type { ItemType, Mood } from './tuning'

export function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2)
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.35)
  ctx.bezierCurveTo(x - s * 1.05, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.35)
  ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.05, y - s * 0.35, x, y + s * 0.35)
  ctx.closePath()
}

export function star4(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.38
    const a = -Math.PI / 2 + (i * Math.PI) / 4
    const px = x + Math.cos(a) * rad
    const py = y + Math.sin(a) * rad
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function star5(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const px = x + Math.cos(a) * rad
    const py = y + Math.sin(a) * rad
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function blob(ctx: CanvasRenderingContext2D, r: number, seed: number, squash: number): void {
  const n = 9
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const wob = 1 + 0.11 * Math.sin(a * 3 + seed) + 0.05 * Math.sin(a * 5 + seed * 2)
    const x = Math.cos(a) * r * wob
    const y = Math.sin(a) * r * wob * squash
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function sticker(ctx: CanvasRenderingContext2D, width = 3): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.lineWidth = width
  ctx.stroke()
}

export function paintWorld(ctx: CanvasRenderingContext2D, scene: Scene, designH: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, scene.originY + 30)
  sky.addColorStop(0, '#FFF4F9')
  sky.addColorStop(0.55, '#FFE3F0')
  sky.addColorStop(1, '#FFD6EA')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 390, scene.originY + 36)

  ctx.fillStyle = 'rgba(255, 214, 140, 0.55)'
  ellipse(ctx, 318, scene.originY - 78, 26, 26)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 236, 186, 0.45)'
  ellipse(ctx, 318, scene.originY - 78, 46, 46)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ellipse(ctx, 78, scene.originY - 86, 34, 16)
  ctx.fill()
  ellipse(ctx, 108, scene.originY - 80, 22, 12)
  ctx.fill()
  ellipse(ctx, 250, scene.originY - 96, 28, 13)
  ctx.fill()

  const caveTop = scene.originY + 8
  roundRect(ctx, 8, caveTop, 374, Math.max(40, designH - caveTop + 20), 32)
  const cave = ctx.createLinearGradient(0, caveTop, 0, designH)
  cave.addColorStop(0, '#F8D5E6')
  cave.addColorStop(0.35, '#F0D4F2')
  cave.addColorStop(0.62, '#E5D8F8')
  cave.addColorStop(1, '#FDE6D4')
  ctx.fillStyle = cave
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ellipse(ctx, 195, caveTop + 70, 120, 36)
  ctx.fill()

  drawCrystal(ctx, 18, caveTop + 36, 46, 110, '#C9F3E6', '#8ED9C8')
  drawCrystal(ctx, 6, caveTop + 90, 34, 78, '#E6D4FB', '#C7A8EE')
  drawCrystal(ctx, 338, caveTop + 28, 42, 120, '#FFD0E4', '#F3A8C6')
  drawCrystal(ctx, 356, caveTop + 100, 30, 70, '#D9F0FF', '#A9D4F5')

  const floor = scene.groundY
  ctx.fillStyle = 'rgba(255, 247, 251, 0.55)'
  for (let i = 0; i < 8; i++) {
    const x = 36 + i * 44
    ellipse(ctx, x, floor - 2, 26, 12)
    ctx.fill()
  }

  // foreground garden down to the bottom of the screen
  const ledge = ctx.createLinearGradient(0, floor, 0, designH)
  ledge.addColorStop(0, 'rgba(255, 236, 244, 0)')
  ledge.addColorStop(0.08, '#FFE7F1')
  ledge.addColorStop(1, '#FDE4D8')
  ctx.fillStyle = ledge
  ctx.fillRect(0, floor - 6, 390, designH - floor + 20)

  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(16, floor + 8)
  for (let x = 16; x <= 374; x += 28) {
    ctx.quadraticCurveTo(x + 14, floor - 6, x + 28, floor + 8)
  }
  ctx.stroke()

  const flowers: Array<[number, number, string]> = [
    [48, 28, '#F7A8C4'],
    [96, 46, '#F2C14E'],
    [150, 24, '#E6B6F2'],
    [210, 52, '#F6A0BE'],
    [268, 30, '#F2C14E'],
    [324, 48, '#B7E6D4'],
    [70, 78, '#FFC2D8'],
    [180, 86, '#C9F3E6'],
    [300, 80, '#F2C14E'],
  ]
  for (const [fx, fy, color] of flowers) {
    if (floor + fy < designH - 8) drawFlower(ctx, fx, floor + fy, color)
  }

  drawPlatform(ctx, scene)
}

function drawCrystal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  light: string,
  deep: string,
): void {
  ctx.beginPath()
  ctx.moveTo(x + w * 0.5, y)
  ctx.lineTo(x + w, y + h * 0.72)
  ctx.lineTo(x + w * 0.72, y + h)
  ctx.lineTo(x + w * 0.18, y + h * 0.86)
  ctx.closePath()
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, '#FFFFFF')
  g.addColorStop(0.35, light)
  g.addColorStop(1, deep)
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    ellipse(ctx, x + Math.cos(a) * 6, y + Math.sin(a) * 6, 4.2, 3.2)
    ctx.fill()
  }
  ctx.fillStyle = '#FFF6D4'
  ellipse(ctx, x, y, 3, 3)
  ctx.fill()
  ctx.strokeStyle = '#C9E8D4'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x, y + 4)
  ctx.lineTo(x, y + 16)
  ctx.stroke()
}

function drawPlatform(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const y = scene.originY - 16
  roundRect(ctx, 16, y, 358, 30, 14)
  const g = ctx.createLinearGradient(0, y, 0, y + 30)
  g.addColorStop(0, '#FFF9FC')
  g.addColorStop(1, '#FFD3E4')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#F4A6C0'
  for (const hx of [48, 92, 300, 340]) {
    heart(ctx, hx, y + 16, 5)
    ctx.fill()
  }
}

export function drawWinch(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const x = scene.originX
  const y = scene.originY
  ctx.save()
  ctx.translate(x, y)

  ctx.fillStyle = 'rgba(214, 140, 168, 0.18)'
  ellipse(ctx, 0, 4, 28, 6)
  ctx.fill()

  roundRect(ctx, -32, -36, 64, 38, 14)
  const g = ctx.createLinearGradient(0, -36, 0, 2)
  g.addColorStop(0, '#FFD6E6')
  g.addColorStop(1, '#F7A8C4')
  ctx.fillStyle = g
  ctx.fill()
  sticker(ctx, 2)

  ctx.fillStyle = '#FFE9F2'
  ellipse(ctx, 0, -16, 16, 16)
  ctx.fill()
  ctx.strokeStyle = '#F2C14E'
  ctx.lineWidth = 3
  ellipse(ctx, 0, -16, 11, 11)
  ctx.stroke()

  ctx.fillStyle = '#F2C14E'
  heart(ctx, 0, -14, 6)
  ctx.fill()

  ctx.strokeStyle = '#E989A8'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(18, -20)
  ctx.lineTo(34, -28)
  ctx.stroke()
  ctx.fillStyle = '#FFF6D4'
  ellipse(ctx, 36, -30, 5, 5)
  ctx.fill()
  ctx.restore()
}

export function drawRope(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.strokeStyle = '#F4B7CC'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  const dist = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.max(1, Math.floor(dist / 16))
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t
    ctx.fillStyle = i % 2 === 0 ? '#FFF8FB' : '#FFD6E6'
    ellipse(ctx, x, y, 3.1, 3.1)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ellipse(ctx, x - 0.8, y - 0.8, 1.1, 1.1)
    ctx.fill()
  }
}

export function drawClaw(ctx: CanvasRenderingContext2D, open: number): void {
  const spread = 0.42 + open * 0.72
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const prong = (dir: number) => {
    ctx.save()
    ctx.rotate(spread * dir)
    ctx.beginPath()
    ctx.moveTo(0, 6)
    ctx.quadraticCurveTo(10 * dir, 18, 7 * dir, 30)
    ctx.quadraticCurveTo(4 * dir, 40, -2 * dir, 36)
    ctx.strokeStyle = '#F6C453'
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }
  prong(-1)
  prong(1)

  ctx.fillStyle = '#FFF1C9'
  ellipse(ctx, 0, 4, 8, 8)
  ctx.fill()
  ctx.fillStyle = '#F6A8C4'
  heart(ctx, 0, 5, 4.5)
  ctx.fill()
}

export function drawItem(
  ctx: CanvasRenderingContext2D,
  type: ItemType,
  x: number,
  y: number,
  r: number,
  rot: number,
  seed: number,
  time: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.fillStyle = 'rgba(186, 120, 150, 0.16)'
  ellipse(ctx, 0, r * 0.72, r * 0.72, r * 0.22)
  ctx.fill()

  if (type === 'goldS' || type === 'goldM' || type === 'goldL') drawGold(ctx, r, seed)
  else if (type === 'gem') drawGem(ctx, r, time)
  else if (type === 'rockS' || type === 'rockL') drawRock(ctx, r, seed, type === 'rockL')
  else if (type === 'bag') drawBag(ctx, r)
  else if (type === 'clock') drawClock(ctx, r, time)
  else if (type === 'star') drawStarItem(ctx, r, time)
  else drawCandy(ctx, r)

  ctx.restore()
}

function drawGold(ctx: CanvasRenderingContext2D, r: number, seed: number): void {
  blob(ctx, r, seed, 0.86)
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r)
  g.addColorStop(0, '#FFF6C8')
  g.addColorStop(0.45, '#F6C453')
  g.addColorStop(1, '#E0942E')
  ctx.fillStyle = g
  ctx.fill()
  sticker(ctx, Math.max(2, r * 0.12))
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ellipse(ctx, -r * 0.28, -r * 0.32, r * 0.28, r * 0.16)
  ctx.fill()
  ctx.fillStyle = '#FFF8DC'
  star4(ctx, r * 0.38, -r * 0.1, Math.max(3, r * 0.16))
  ctx.fill()
}

function drawGem(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.lineTo(r * 0.78, -r * 0.12)
  ctx.lineTo(0, r * 1.05)
  ctx.lineTo(-r * 0.78, -r * 0.12)
  ctx.closePath()
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, '#FFFFFF')
  g.addColorStop(0.35, '#F6C6FF')
  g.addColorStop(0.7, '#FFD0E4')
  g.addColorStop(1, '#A8E6D4')
  ctx.fillStyle = g
  ctx.fill()
  sticker(ctx, 2)
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.lineTo(0, r * 1.05)
  ctx.moveTo(-r * 0.78, -r * 0.12)
  ctx.lineTo(r * 0.78, -r * 0.12)
  ctx.moveTo(0, -r * 0.12)
  ctx.lineTo(-r * 0.78, -r * 0.12)
  ctx.moveTo(0, -r * 0.12)
  ctx.lineTo(r * 0.78, -r * 0.12)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 1.4
  ctx.stroke()
  const tw = 0.45 + Math.sin(time * 5) * 0.35
  ctx.globalAlpha = Math.max(0.2, tw)
  ctx.fillStyle = '#FFFFFF'
  star4(ctx, r * 0.2, -r * 0.35, 3.5)
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawRock(ctx: CanvasRenderingContext2D, r: number, seed: number, heavy: boolean): void {
  blob(ctx, r, seed + 2, heavy ? 0.82 : 0.9)
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.2, 0, 0, r * 1.1)
  g.addColorStop(0, '#F4E7EC')
  g.addColorStop(0.5, '#D9C6CE')
  g.addColorStop(1, '#B79EAA')
  ctx.fillStyle = g
  ctx.fill()
  sticker(ctx, Math.max(2, r * 0.1))
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ellipse(ctx, -r * 0.25, -r * 0.28, r * 0.22, r * 0.12)
  ctx.fill()

  ctx.fillStyle = '#7C6570'
  const eyeY = r * 0.05
  if (heavy) {
    ctx.strokeStyle = '#7C6570'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-r * 0.28, eyeY)
    ctx.lineTo(-r * 0.1, eyeY + 1)
    ctx.moveTo(r * 0.1, eyeY + 1)
    ctx.lineTo(r * 0.28, eyeY)
    ctx.moveTo(-r * 0.12, r * 0.32)
    ctx.quadraticCurveTo(0, r * 0.22, r * 0.12, r * 0.32)
    ctx.stroke()
  } else {
    ellipse(ctx, -r * 0.22, eyeY, 2.1, 2.4)
    ctx.fill()
    ellipse(ctx, r * 0.22, eyeY, 2.1, 2.4)
    ctx.fill()
    ctx.strokeStyle = '#7C6570'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(-r * 0.12, r * 0.28)
    ctx.quadraticCurveTo(0, r * 0.4, r * 0.12, r * 0.28)
    ctx.stroke()
  }
}

function drawBag(ctx: CanvasRenderingContext2D, r: number): void {
  roundRect(ctx, -r * 0.78, -r * 0.35, r * 1.56, r * 1.25, r * 0.45)
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, '#FFD0E2')
  g.addColorStop(1, '#F48AB3')
  ctx.fillStyle = g
  ctx.fill()
  sticker(ctx, 2)
  ctx.fillStyle = '#F6C453'
  heart(ctx, 0, r * 0.22, r * 0.28)
  ctx.fill()
  ctx.strokeStyle = '#F2C14E'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-r * 0.35, -r * 0.35)
  ctx.quadraticCurveTo(0, -r * 0.95, r * 0.35, -r * 0.35)
  ctx.stroke()
  ctx.fillStyle = '#F2C14E'
  ellipse(ctx, 0, -r * 0.72, r * 0.16, r * 0.12)
  ctx.fill()
}

function drawClock(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  ctx.fillStyle = 'rgba(247, 168, 196, 0.28)'
  ellipse(ctx, 0, 2, r * 1.15, r * 1.15)
  ctx.fill()
  ctx.fillStyle = '#F7A8C4'
  ellipse(ctx, -r * 0.32, -r * 0.95, r * 0.28, r * 0.2)
  ctx.fill()
  ellipse(ctx, r * 0.32, -r * 0.95, r * 0.28, r * 0.2)
  ctx.fill()
  ctx.fillStyle = '#F2C14E'
  ellipse(ctx, 0, -r * 0.9, r * 0.14, r * 0.14)
  ctx.fill()

  ellipse(ctx, 0, 0, r, r)
  ctx.fillStyle = '#FFF9F4'
  ctx.fill()
  ctx.strokeStyle = '#F7A8C4'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.strokeStyle = '#E989A8'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -r * 0.48)
  ctx.moveTo(0, 0)
  const a = time * 1.6
  ctx.lineTo(Math.sin(a) * r * 0.32, -Math.cos(a) * r * 0.32)
  ctx.stroke()
  ctx.fillStyle = '#F7A8C4'
  ellipse(ctx, 0, 0, 2.2, 2.2)
  ctx.fill()
}

function drawStarItem(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  ctx.fillStyle = `rgba(255, 214, 140, ${0.25 + Math.sin(time * 4) * 0.08})`
  ellipse(ctx, 0, 0, r * 1.35, r * 1.35)
  ctx.fill()
  star5(ctx, 0, 0, r)
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r)
  g.addColorStop(0, '#FFFFFF')
  g.addColorStop(0.4, '#FFE08A')
  g.addColorStop(1, '#F7A8C4')
  ctx.fillStyle = g
  ctx.fill()
  sticker(ctx, 2)
}

function drawCandy(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = '#B7E6D4'
  ellipse(ctx, -r * 0.95, 0, r * 0.38, r * 0.28)
  ctx.fill()
  ctx.fillStyle = '#FFE08A'
  ellipse(ctx, r * 0.95, 0, r * 0.38, r * 0.28)
  ctx.fill()
  ellipse(ctx, 0, 0, r * 0.82, r * 0.7)
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r)
  g.addColorStop(0, '#FFE4EF')
  g.addColorStop(1, '#F48AB3')
  ctx.fillStyle = g
  ctx.fill()
  sticker(ctx, 2)
  ctx.fillStyle = '#FFFFFF'
  star4(ctx, -r * 0.1, -r * 0.12, r * 0.22)
  ctx.fill()
}

export function drawGirl(ctx: CanvasRenderingContext2D, mood: Mood, blink: boolean): void {
  // Local space: feet at y=0, about 108px tall.
  ctx.fillStyle = 'rgba(206, 132, 160, 0.2)'
  ellipse(ctx, 2, -2, 30, 7)
  ctx.fill()

  ctx.fillStyle = '#F48FB4'
  ellipse(ctx, 0, -78, 30, 26)
  ctx.fill()

  roundRect(ctx, -18, -62, 36, 30, 12)
  ctx.fillStyle = '#FFE7F0'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(-24, -42)
  ctx.quadraticCurveTo(-30, -16, -16, -12)
  ctx.lineTo(18, -12)
  ctx.quadraticCurveTo(32, -16, 24, -42)
  ctx.closePath()
  ctx.fillStyle = '#B7E6D4'
  ctx.fill()
  sticker(ctx, 2)

  ctx.fillStyle = '#E7FAF4'
  roundRect(ctx, -8, -34, 16, 12, 5)
  ctx.fill()
  ctx.fillStyle = '#F48FB4'
  heart(ctx, 0, -26, 3.4)
  ctx.fill()

  ctx.strokeStyle = '#9ADFCC'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-10, -58)
  ctx.lineTo(-8, -42)
  ctx.moveTo(10, -58)
  ctx.lineTo(8, -42)
  ctx.stroke()
  ctx.fillStyle = '#F2C14E'
  ellipse(ctx, -8, -50, 2.2, 2.2)
  ctx.fill()
  ellipse(ctx, 8, -50, 2.2, 2.2)
  ctx.fill()

  ctx.strokeStyle = '#FFD0BE'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(-10, -14)
  ctx.lineTo(-12, -2)
  ctx.moveTo(12, -14)
  ctx.lineTo(14, -2)
  ctx.stroke()
  ctx.fillStyle = '#F48FB4'
  ellipse(ctx, -14, -2, 8, 5)
  ctx.fill()
  ellipse(ctx, 15, -2, 8, 5)
  ctx.fill()

  ctx.strokeStyle = '#FFD0BE'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(-16, -54)
  ctx.quadraticCurveTo(-36, -48, -30, -34)
  ctx.stroke()
  ctx.fillStyle = '#FFD0BE'
  ellipse(ctx, -30, -32, 4.5, 4.5)
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(16, -52)
  ctx.quadraticCurveTo(36, -50, 42, -36)
  ctx.stroke()
  ellipse(ctx, 43, -34, 4.5, 4.5)
  ctx.fill()

  ctx.fillStyle = '#FFD8C6'
  roundRect(ctx, -5, -70, 10, 12, 4)
  ctx.fill()

  ellipse(ctx, 0, -86, 24, 22)
  ctx.fillStyle = '#FFE0D2'
  ctx.fill()
  sticker(ctx, 2)

  ctx.fillStyle = '#FFD0BE'
  ellipse(ctx, -23, -86, 5, 6)
  ctx.fill()
  ellipse(ctx, 23, -86, 5, 6)
  ctx.fill()

  ctx.fillStyle = '#F48FB4'
  ctx.beginPath()
  ctx.moveTo(-22, -90)
  ctx.quadraticCurveTo(-16, -108, 0, -106)
  ctx.quadraticCurveTo(16, -108, 22, -90)
  ctx.quadraticCurveTo(12, -80, 5, -84)
  ctx.quadraticCurveTo(0, -76, -6, -84)
  ctx.quadraticCurveTo(-14, -80, -22, -90)
  ctx.fill()

  ctx.fillStyle = '#FFB3CC'
  roundRect(ctx, -26, -70, 10, 28, 6)
  ctx.fill()
  roundRect(ctx, 16, -70, 10, 26, 6)
  ctx.fill()

  // helmet
  ctx.fillStyle = '#FFF6EA'
  ellipse(ctx, 0, -104, 20, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#FFD0E2'
  ellipse(ctx, 0, -98, 22, 5.5)
  ctx.fill()
  ctx.fillStyle = '#F2C14E'
  heart(ctx, 0, -106, 4)
  ctx.fill()
  bow(ctx, -16, -108, 5, '#F7A8C4')

  ctx.fillStyle = '#FFF4C2'
  ellipse(ctx, 18, -102, 6, 6)
  ctx.fill()
  ctx.fillStyle = '#FFE08A'
  ellipse(ctx, 18, -102, 3.2, 3.2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  ellipse(ctx, -8, -100, 6, 3)
  ctx.fill()

  drawFace(ctx, mood, blink)
}

function bow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  ctx.fillStyle = color
  ellipse(ctx, x - s * 0.7, y, s * 0.7, s * 0.48)
  ctx.fill()
  ellipse(ctx, x + s * 0.7, y, s * 0.7, s * 0.48)
  ctx.fill()
  ctx.fillStyle = '#FFE08A'
  ellipse(ctx, x, y, s * 0.32, s * 0.32)
  ctx.fill()
}

function drawFace(ctx: CanvasRenderingContext2D, mood: Mood, blink: boolean): void {
  ctx.fillStyle = 'rgba(255, 148, 176, 0.55)'
  ellipse(ctx, -12, -82, 5.5, 3.2)
  ctx.fill()
  ellipse(ctx, 12, -82, 5.5, 3.2)
  ctx.fill()

  if (mood === 'pout' || mood === 'effort') {
    ctx.strokeStyle = '#C97B90'
    ctx.lineWidth = 1.6
    ctx.lineCap = 'round'
    ctx.beginPath()
    if (mood === 'pout') {
      ctx.moveTo(-16, -96)
      ctx.lineTo(-8, -94)
      ctx.moveTo(8, -94)
      ctx.lineTo(16, -96)
    } else {
      ctx.moveTo(-16, -94)
      ctx.lineTo(-8, -97)
      ctx.moveTo(8, -97)
      ctx.lineTo(16, -94)
    }
    ctx.stroke()
  }

  if (mood === 'happy') {
    happyEye(ctx, -9, -88)
    happyEye(ctx, 9, -88)
    openSmile(ctx, -78)
  } else if (mood === 'wow') {
    wowEye(ctx, -9, -88)
    wowEye(ctx, 9, -88)
    ctx.strokeStyle = '#E07A90'
    ctx.lineWidth = 1.8
    ellipse(ctx, 0, -76, 3.2, 3.6)
    ctx.stroke()
  } else if (mood === 'pout') {
    eye(ctx, -9, -87, false, 0.9)
    eye(ctx, 9, -87, false, 0.9)
    ctx.strokeStyle = '#E07A90'
    ctx.lineWidth = 1.7
    ctx.beginPath()
    ctx.moveTo(-5, -75)
    ctx.quadraticCurveTo(0, -72, 5, -75)
    ctx.stroke()
  } else if (mood === 'effort') {
    eye(ctx, -9, -87, false, 0.55)
    eye(ctx, 9, -87, false, 0.55)
    ctx.strokeStyle = '#E07A90'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(-4, -75)
    ctx.lineTo(4, -75)
    ctx.stroke()
    ctx.fillStyle = '#9AD4E8'
    ctx.beginPath()
    ctx.moveTo(16, -96)
    ctx.quadraticCurveTo(22, -90, 17, -84)
    ctx.quadraticCurveTo(14, -90, 16, -96)
    ctx.fill()
  } else {
    eye(ctx, -9, -88, blink, 1)
    eye(ctx, 9, -88, blink, 1)
    ctx.strokeStyle = '#E07A90'
    ctx.lineWidth = 1.7
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-5, -76)
    ctx.quadraticCurveTo(0, -72, 5, -76)
    ctx.stroke()
  }
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, blink: boolean, squash: number): void {
  if (blink) {
    ctx.strokeStyle = '#5C4652'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x - 6, y)
    ctx.quadraticCurveTo(x, y + 1.5, x + 6, y)
    ctx.stroke()
    return
  }
  ctx.fillStyle = '#FFFFFF'
  ellipse(ctx, x, y, 6.2, 7 * squash)
  ctx.fill()
  ctx.fillStyle = '#4A3944'
  ellipse(ctx, x + 0.8, y + 0.6, 3.3, 3.8 * squash)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ellipse(ctx, x - 1, y - 1.4, 1.5, 1.5)
  ctx.fill()
}

function happyEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = '#5C4652'
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 6, y + 1)
  ctx.quadraticCurveTo(x, y - 5, x + 6, y + 1)
  ctx.stroke()
}

function wowEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#FFFFFF'
  ellipse(ctx, x, y, 7, 8)
  ctx.fill()
  ctx.fillStyle = '#F2C14E'
  star4(ctx, x + 0.4, y + 0.4, 4.2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ellipse(ctx, x - 1.5, y - 2, 1.4, 1.4)
  ctx.fill()
}

function openSmile(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.beginPath()
  ctx.arc(0, y, 6, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.fillStyle = '#E989A8'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, y + 2.5, 3.2, Math.PI, 0)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
}

export function drawMoodSparkles(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, mood: Mood): void {
  if (mood !== 'happy' && mood !== 'wow') return
  const spots = [
    [x - 28, y - 96],
    [x + 30, y - 88],
    [x + 8, y - 112],
  ]
  spots.forEach(([sx, sy], i) => {
    const a = 0.35 + Math.sin(time * 5 + i) * 0.35
    ctx.globalAlpha = Math.max(0, a)
    ctx.fillStyle = mood === 'wow' ? '#F2C14E' : '#FFFFFF'
    star4(ctx, sx, sy, 4 + (i === 2 ? 2 : 0))
    ctx.fill()
  })
  ctx.globalAlpha = 1
}

export function renderHero(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  ctx.clearRect(0, 0, w, h)
  const s = Math.min(w / 280, h / 210)
  ctx.save()
  ctx.translate(w / 2, h * 0.78 + Math.sin(time * 1.6) * 3)
  ctx.scale(s * 1.15, s * 1.15)
  drawGirl(ctx, moodCycle(time), Math.floor(time) % 4 === 0 && time % 1 > 0.85)
  ctx.restore()

  const gems: Array<{ type: ItemType; ang: number; dist: number; r: number; seed: number }> = [
    { type: 'goldM', ang: -0.9, dist: 78, r: 18, seed: 1 },
    { type: 'gem', ang: -2.2, dist: 86, r: 13, seed: 2 },
    { type: 'goldS', ang: 0.7, dist: 84, r: 13, seed: 3 },
    { type: 'star', ang: 2.3, dist: 74, r: 12, seed: 4 },
  ]
  for (const gem of gems) {
    const bob = Math.sin(time * 1.4 + gem.seed) * 6
    const x = w / 2 + Math.cos(gem.ang + time * 0.15) * gem.dist * s
    const y = h * 0.46 + Math.sin(gem.ang + time * 0.15) * gem.dist * 0.62 * s + bob
    drawItem(ctx, gem.type, x, y, gem.r * s, 0, gem.seed, time)
  }
}

function moodCycle(time: number): Mood {
  const moods: Mood[] = ['idle', 'happy', 'wow', 'happy']
  return moods[Math.floor(time / 2.4) % moods.length]
}

export function girlAnchorX(): number {
  return 74
}
