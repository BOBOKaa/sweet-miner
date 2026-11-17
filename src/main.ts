import './style.css'
import { drawItem, renderHero } from './game/art'
import { Sfx } from './game/audio'
import { GameEngine, type ClearInfo, type HudSnapshot, type SfxName } from './game/engine'
import { LEVELS } from './game/levels'
import { freshRun, loadSave, writeSave, type SaveData } from './game/storage'
import {
  SHOP,
  STATS,
  TIME_BONUS_MAX,
  TIME_BONUS_STEP,
  emptyBuffs,
  type ItemType,
} from './game/tuning'

const save: SaveData = loadSave()
const sfx = new Sfx()
sfx.setMuted(save.mute)

const el = {
  continue: byId<HTMLButtonElement>('btn-continue'),
  neu: byId<HTMLButtonElement>('btn-new'),
  help: byId<HTMLButtonElement>('btn-help'),
  helpBack: byId<HTMLButtonElement>('btn-help-back'),
  best: byId<HTMLElement>('start-best'),
  progress: byId<HTMLElement>('progress-stars'),
  hero: byId<HTMLCanvasElement>('hero'),
  legend: byId<HTMLElement>('legend'),
  pause: byId<HTMLButtonElement>('btn-pause'),
  mute: byId<HTMLButtonElement>('btn-mute'),
  shopMoney: byId<HTMLElement>('shop-money'),
  depart: byId<HTMLButtonElement>('btn-depart'),
  shopHome: byId<HTMLButtonElement>('btn-shop-home'),
  endingCopy: byId<HTMLElement>('ending-copy'),
  endingStars: byId<HTMLElement>('ending-stars'),
  endingMoney: byId<HTMLElement>('ending-money'),
  again: byId<HTMLButtonElement>('btn-again'),
  endingHome: byId<HTMLButtonElement>('btn-ending-home'),
  stage: byId<HTMLElement>('stage'),
  canvas: byId<HTMLCanvasElement>('game'),
  hudLevel: byId<HTMLElement>('hud-level'),
  hudName: byId<HTMLElement>('hud-name'),
  hudTime: byId<HTMLElement>('hud-time'),
  hudScore: byId<HTMLElement>('hud-score'),
  hudTarget: byId<HTMLElement>('hud-target'),
  hudMoney: byId<HTMLElement>('hud-money'),
  hudBar: byId<HTMLElement>('hud-bar'),
  hudClear: byId<HTMLElement>('hud-clear'),
  hudPills: byId<HTMLElement>('hud-pills'),
  banner: byId<HTMLElement>('banner'),
  bannerKicker: byId<HTMLElement>('banner-kicker'),
  bannerTitle: byId<HTMLElement>('banner-title'),
  hint: byId<HTMLElement>('hint'),
  bomb: byId<HTMLButtonElement>('btn-bomb'),
  bombCount: byId<HTMLElement>('bomb-count'),
  shoot: byId<HTMLButtonElement>('btn-shoot'),
  shootLabel: byId<HTMLElement>('shoot-label'),
  overlayPause: byId<HTMLElement>('overlay-pause'),
  overlayResult: byId<HTMLElement>('overlay-result'),
  resultKicker: byId<HTMLElement>('result-kicker'),
  resultTitle: byId<HTMLElement>('result-title'),
  resultBody: byId<HTMLElement>('result-body'),
  resultStars: byId<HTMLElement>('result-stars'),
  resultPrimary: byId<HTMLButtonElement>('result-primary'),
  resultSecondary: byId<HTMLButtonElement>('result-secondary'),
  resume: byId<HTMLButtonElement>('btn-resume'),
  restart: byId<HTMLButtonElement>('btn-restart'),
  quit: byId<HTMLButtonElement>('btn-quit'),
  toast: byId<HTMLElement>('toast'),
  buyBomb: byId<HTMLButtonElement>('buy-bomb'),
  buyStrength: byId<HTMLButtonElement>('buy-strength'),
  buyClover: byId<HTMLButtonElement>('buy-clover'),
  buyTime: byId<HTMLButtonElement>('buy-time'),
  ownBomb: byId<HTMLElement>('own-bomb'),
  ownStrength: byId<HTMLElement>('own-strength'),
  ownClover: byId<HTMLElement>('own-clover'),
  ownTime: byId<HTMLElement>('own-time'),
}

let screen = 'screen-start'
let heroOn = false
let heroRaf = 0
let armReset = false
let toastTimer = 0
let resultMode: 'win' | 'lose' | null = null
let lastScore = 0
let showedClear = false
let scoreCommitted = false

const engine = new GameEngine(el.canvas, {
  onHud: renderHud,
  onWin: handleWin,
  onLose: handleLose,
  onBomb: (left) => {
    if (save.run) save.run.bombs = left
    writeSave(save)
  },
  play: playSfx,
})

bind()
renderMute()
buildLegend()
showStart()

function bind(): void {
  el.continue.addEventListener('click', () => {
    unlock()
    if (!save.run) return
    if (save.run.needsShop) openShop()
    else beginLevel()
  })
  el.neu.addEventListener('click', () => {
    unlock()
    if (save.run && !armReset) {
      armReset = true
      el.neu.textContent = '确定重新开始？'
      window.setTimeout(() => {
        armReset = false
        if (save.run) el.neu.textContent = '重新开始'
      }, 2200)
      return
    }
    armReset = false
    save.run = freshRun()
    writeSave(save)
    beginLevel()
  })
  el.help.addEventListener('click', () => {
    unlock()
    show('screen-help')
  })
  el.helpBack.addEventListener('click', () => showStart())
  el.pause.addEventListener('click', () => {
    unlock()
    if (screen !== 'screen-game' || resultMode) return
    if (!el.overlayPause.classList.contains('hidden')) resume()
    else openPause()
  })
  el.mute.addEventListener('click', toggleMute)
  el.shoot.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    event.stopPropagation()
    tryShoot()
  })
  el.bomb.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    event.stopPropagation()
    unlock()
    if (!engine.tryBomb()) nudge(el.bomb)
  })
  el.stage.addEventListener('pointerdown', (event) => {
    const target = event.target as HTMLElement
    if (target.closest('button, .overlay')) return
    tryShoot()
  })
  el.stage.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false })
  el.stage.addEventListener('contextmenu', (event) => event.preventDefault())
  el.resume.addEventListener('click', resume)
  el.restart.addEventListener('click', () => {
    unlock()
    closePause()
    beginLevel()
  })
  el.quit.addEventListener('click', () => {
    unlock()
    leaveGame()
    showStart()
  })
  el.resultPrimary.addEventListener('click', () => {
    unlock()
    if (resultMode === 'win') {
      closeResult()
      leaveGame()
      openShop()
    } else {
      closeResult()
      beginLevel()
    }
  })
  el.resultSecondary.addEventListener('click', () => {
    unlock()
    closeResult()
    leaveGame()
    showStart()
  })
  el.depart.addEventListener('click', () => {
    unlock()
    if (!save.run) return
    save.run.needsShop = false
    writeSave(save)
    beginLevel()
  })
  el.shopHome.addEventListener('click', () => showStart())
  el.again.addEventListener('click', () => {
    unlock()
    save.run = freshRun()
    writeSave(save)
    beginLevel()
  })
  el.endingHome.addEventListener('click', () => showStart())
  el.buyBomb.addEventListener('click', () => buy('bomb'))
  el.buyStrength.addEventListener('click', () => buy('strength'))
  el.buyClover.addEventListener('click', () => buy('clover'))
  el.buyTime.addEventListener('click', () => buy('time'))

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return
    if (event.code === 'Space') {
      event.preventDefault()
      tryShoot()
    } else if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      if (screen === 'screen-game' && !resultMode) {
        if (el.overlayPause.classList.contains('hidden')) openPause()
        else resume()
      }
    } else if (event.key === 'b' || event.key === 'B') {
      unlock()
      engine.tryBomb()
    } else if (event.key === 'm' || event.key === 'M') toggleMute()
  })
  window.addEventListener('resize', () => {
    if (screen === 'screen-game') measure()
    paintHeroOnce()
  })
  document.addEventListener('pointerdown', (event) => {
    unlock()
    const target = event.target
    if (!(target instanceof Element) || save.mute) return
    if (target.closest('#btn-shoot, #btn-bomb, #btn-mute, #buy-bomb, #buy-strength, #buy-clover, #buy-time')) return
    if (target.closest('button')) sfx.ui()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'screen-game' && !resultMode && el.overlayPause.classList.contains('hidden')) {
      openPause()
    }
  })
  const watcher = new ResizeObserver(() => {
    if (screen === 'screen-game') measure()
  })
  watcher.observe(el.stage)
}

function show(id: string): void {
  screen = id
  for (const node of document.querySelectorAll('.screen')) node.classList.toggle('hidden', node.id !== id)
  el.pause.classList.toggle('hidden', id !== 'screen-game')
  if (id === 'screen-start') startHero()
  else stopHero()
}

function showStart(): void {
  const run = save.run
  el.continue.classList.toggle('hidden', !run)
  if (run) {
    el.continue.textContent = run.needsShop ? `去小铺 · 第 ${run.level} 关` : `继续第 ${run.level} 关`
    el.neu.textContent = '重新开始'
    el.neu.classList.add('secondary')
    el.continue.classList.remove('secondary')
  } else {
    el.neu.textContent = '开始冒险'
    el.neu.classList.remove('secondary')
  }
  el.best.textContent =
    save.bestLevel > 0
      ? `最远到达第 ${save.bestLevel} 关 · 单局最多 ${save.bestMoney} 金`
      : '还没有记录，第一下就从这里开始'
  const groups: string[] = []
  for (let start = 0; start < save.stars.length; start += 10) {
    const pips = save.stars.slice(start, start + 10).map((stars, offset) => {
      const index = start + offset
      const cls = stars > 0 ? 'pip on' : 'pip'
      const best = index + 1 === save.bestLevel ? ' best' : ''
      return `<i class="${cls}${best}" title="第 ${index + 1} 关"></i>`
    })
    groups.push(`<span class="chapter">${pips.join('')}</span>`)
  }
  el.progress.innerHTML = groups.join('')
  const lit = save.stars.filter((count) => count > 0).length
  el.progress.setAttribute('aria-label', `已点亮 ${lit} / ${save.stars.length} 关`)
  show('screen-start')
}

function openShop(): void {
  renderShop()
  show('screen-shop')
}

function renderShop(): void {
  const run = save.run
  if (!run) return
  const level = LEVELS[run.level - 1]
  el.shopMoney.textContent = String(run.money)
  el.depart.textContent = `出发 · 第 ${run.level} 关 ${level?.name ?? ''}`
  el.ownBomb.textContent = `携带 ${run.bombs}`
  el.ownStrength.textContent = run.buffs.strength ? '本关已装备' : '未准备'
  el.ownClover.textContent = run.buffs.clover ? '本关已装备' : '未准备'
  el.ownTime.textContent = run.buffs.extraTime ? `本关 +${run.buffs.extraTime} 秒` : '未准备'
  setBuy(el.buyBomb, run.bombs < 9, run.bombs >= 9 ? '已装满' : `${SHOP.bomb.price} 金`)
  setBuy(el.buyStrength, !run.buffs.strength, run.buffs.strength ? '已装备' : `${SHOP.strength.price} 金`)
  setBuy(el.buyClover, !run.buffs.clover, run.buffs.clover ? '已装备' : `${SHOP.clover.price} 金`)
  setBuy(el.buyTime, run.buffs.extraTime < TIME_BONUS_MAX, run.buffs.extraTime >= TIME_BONUS_MAX ? '已加满' : `${SHOP.time.price} 金`)
}

function setBuy(button: HTMLButtonElement, enabled: boolean, label: string): void {
  button.disabled = !enabled
  button.textContent = label
}

function buy(kind: keyof typeof SHOP): void {
  unlock()
  const run = save.run
  if (!run) return
  const price = SHOP[kind].price
  if (run.money < price) {
    toast('金币还不够哦')
    sfx.ui()
    return
  }
  if (kind === 'bomb') {
    if (run.bombs >= 9) {
      toast('小炸弹已经装满啦')
      return
    }
    run.bombs += 1
  } else if (kind === 'strength') {
    if (run.buffs.strength) return
    run.buffs.strength = true
  } else if (kind === 'clover') {
    if (run.buffs.clover) return
    run.buffs.clover = true
  } else if (run.buffs.extraTime >= TIME_BONUS_MAX) {
    toast('时间已经加得够多啦')
    return
  } else {
    run.buffs.extraTime += TIME_BONUS_STEP
  }
  run.money -= price
  writeSave(save)
  sfx.buy()
  renderShop()
}

function beginLevel(): void {
  const run = save.run
  if (!run) return
  resultMode = null
  showedClear = false
  scoreCommitted = false
  el.hudClear.classList.add('hidden')
  closePause()
  closeResult()
  show('screen-game')
  writeSave(save)
  requestAnimationFrame(() => {
    measure()
    engine.startLevel(run.level - 1, run.bombs, run.buffs)
    engine.start()
    flashBanner(run.level)
  })
}

function leaveGame(): void {
  engine.stop()
  closePause()
  closeResult()
}

function measure(): void {
  const hud = document.querySelector('.hud') as HTMLElement | null
  const controls = document.querySelector('.controls') as HTMLElement | null
  const rect = el.canvas.getBoundingClientRect()
  engine.setInsets(hud?.offsetHeight ?? 78, controls?.offsetHeight ?? 112)
  engine.resize(rect.width, rect.height)
}

function tryShoot(): void {
  if (screen !== 'screen-game' || resultMode) return
  if (!el.overlayPause.classList.contains('hidden')) return
  unlock()
  engine.shoot()
}

function openPause(): void {
  engine.setPaused(true)
  sfx.setMusicPaused(true)
  el.overlayPause.classList.remove('hidden')
}

function resume(): void {
  unlock()
  closePause()
}

function closePause(): void {
  el.overlayPause.classList.add('hidden')
  engine.setPaused(false)
  sfx.setMusicPaused(false)
}

function closeResult(): void {
  resultMode = null
  el.overlayResult.classList.add('hidden')
}

function handleWin(info: ClearInfo): void {
  const run = save.run
  if (!run) return
  if (!scoreCommitted) {
    run.money += info.score
    scoreCommitted = true
  }
  save.bestMoney = Math.max(save.bestMoney, run.money)
  save.bestLevel = Math.max(save.bestLevel, info.level)
  save.stars[info.level - 1] = Math.max(save.stars[info.level - 1] ?? 0, info.stars)
  const purse = run.money
  run.buffs = emptyBuffs()
  if (info.level >= LEVELS.length) {
    save.run = null
    writeSave(save)
    leaveGame()
  el.endingCopy.textContent = `一百关都过啦，这一局一共带回 ${purse} 金。`
  el.endingMoney.textContent = `${purse} 金`
  const total = save.stars.reduce((sum, n) => sum + n, 0)
  el.endingStars.innerHTML = `<span class="fine">星星 ${total} / ${LEVELS.length * 3}</span>`
    show('screen-ending')
    return
  }
  run.level += 1
  run.needsShop = true
  writeSave(save)
  resultMode = 'win'
  el.resultKicker.textContent = `第 ${info.level} 关 · ${info.name}`
  el.resultTitle.textContent = '过关啦'
  const bonus = info.bonus > 0 ? `含过关后继续挖到的 ${info.bonus} 金。` : ''
  el.resultBody.textContent = `本关收获 ${info.score} 金，${bonus}存款现在是 ${purse} 金。`
  el.resultStars.innerHTML = starRow(info.stars)
  el.resultPrimary.textContent = '去小铺看看'
  el.resultSecondary.textContent = '回标题'
  el.overlayResult.classList.remove('hidden')
}

function handleLose(info: { score: number; target: number }): void {
  writeSave(save)
  resultMode = 'lose'
  const run = save.run
  const level = run ? LEVELS[run.level - 1] : undefined
  el.resultKicker.textContent = level ? `第 ${run?.level} 关 · ${level.name}` : '再试一次'
  el.resultTitle.textContent = '差一点点'
  el.resultBody.textContent = `本关 ${info.score} / 目标 ${info.target}。宝贝还在原地，再挥一次吧。`
  el.resultStars.innerHTML = ''
  el.resultPrimary.textContent = '再试一次'
  el.resultSecondary.textContent = '回标题'
  el.overlayResult.classList.remove('hidden')
}

function renderHud(hud: HudSnapshot): void {
  setText(el.hudLevel, `第 ${hud.level} 关`)
  setText(el.hudName, hud.name)
  setText(el.hudTime, formatTime(hud.timeLeft))
  el.hudTime.classList.toggle('danger', hud.timeLeft <= 10 && hud.phase !== 'win')
  setText(el.hudScore, String(hud.score))
  if (hud.score !== lastScore) {
    lastScore = hud.score
    el.hudScore.classList.remove('score-pop')
    void el.hudScore.offsetWidth
    el.hudScore.classList.add('score-pop')
  }
  setText(el.hudTarget, String(hud.target))
  const carried = save.run?.money ?? 0
  const pending = hud.cleared && !scoreCommitted ? hud.score : 0
  setText(el.hudMoney, String(carried + pending))
  el.hudBar.style.width = `${Math.max(0, Math.min(100, (hud.score / Math.max(1, hud.target)) * 100))}%`
  const overtime = hud.cleared && hud.phase !== 'win' && hud.phase !== 'lose'
  el.hudScore.classList.toggle('cleared', hud.cleared)
  el.hudBar.parentElement?.classList.toggle('cleared', hud.cleared)
  el.hudClear.classList.toggle('hidden', !overtime)
  if (overtime && !showedClear) {
    showedClear = true
    flashClear()
  }
  if (!hud.cleared) showedClear = false
  el.hudPills.innerHTML = hud.pills.map((pill) => `<span>${pill}</span>`).join('')
  setText(el.bombCount, String(hud.bombs))
  const rock = hud.holding === 'rockS' || hud.holding === 'rockL'
  const canBomb = hud.phase === 'retract' && rock && hud.bombs > 0
  el.bomb.disabled = !canBomb
  el.bomb.classList.toggle('ready', canBomb)
  setText(el.shootLabel, shootText(hud))
  setText(el.hint, hud.hint)
  el.hint.classList.toggle('show', hud.hint.length > 0)
}

function shootText(hud: HudSnapshot): string {
  if (hud.phase === 'extend') return '出发'
  if (hud.phase === 'retract') {
    if (hud.weight >= 2.8) return '好重'
    if (hud.weight > 0 && hud.weight < 0.8) return '轻飘飘'
    return hud.holding ? '拉回' : '收回'
  }
  if (hud.phase === 'win') return '好耶'
  if (hud.phase === 'lose') return '哎呀'
  return '发射'
}

function flashClear(): void {
  el.bannerKicker.textContent = '目标达成'
  el.bannerTitle.textContent = '还能继续挖'
  el.banner.classList.remove('show')
  void el.banner.offsetWidth
  el.banner.classList.add('show')
}

function flashBanner(level: number): void {
  const def = LEVELS[level - 1]
  if (!def) return
  el.bannerKicker.textContent = `第 ${level} 关`
  el.bannerTitle.textContent = def.name
  el.banner.classList.remove('show')
  void el.banner.offsetWidth
  el.banner.classList.add('show')
}

function buildLegend(): void {
  const rows: Array<{ type: ItemType; text: string }> = [
    { type: 'goldS', text: '小金块 · 50 金 · 拉得很快' },
    { type: 'goldM', text: '金块 · 160 金 · 刚刚好' },
    { type: 'goldL', text: '大金块 · 430 金 · 有点沉' },
    { type: 'gem', text: '钻石 · 700 金 · 又轻又贵' },
    { type: 'star', text: '星砂 · 330 金 · 会轻轻飘' },
    { type: 'bag', text: '福袋 · 打开是一笔随机金币' },
    { type: 'clock', text: '时钟 · 多给你 8 秒' },
    { type: 'candy', text: '爆爆糖 · 清开旁边的石头' },
    { type: 'rockL', text: '石头 · 又重又便宜，可用小炸弹松开' },
  ]
  for (const row of rows) {
    const wrap = document.createElement('div')
    wrap.className = 'legend-row'
    const canvas = document.createElement('canvas')
    paintIcon(canvas, row.type)
    const text = document.createElement('span')
    text.textContent = row.text
    wrap.append(canvas, text)
    el.legend.append(wrap)
  }
}

function paintIcon(canvas: HTMLCanvasElement, type: ItemType): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.round(42 * dpr)
  canvas.height = Math.round(42 * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  const radius = Math.min(16, STATS[type].r * 0.62)
  drawItem(ctx, type, 21, 22, radius, 0, 1.2, 0.4)
}

function starRow(count: number): string {
  return [1, 2, 3]
    .map((n, index) => {
      const on = n <= count ? 'on' : ''
      return `<svg class="star ${on}" style="animation-delay:${index * 90}ms" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.7 5.6 6.2.9-4.5 4.3 1.1 6.1L12 16.8 6.5 19.5l1.1-6.1L3.1 9.1l6.2-.9z"></path></svg>`
    })
    .join('')
}

function playSfx(name: SfxName): void {
  if (name === 'shoot') sfx.shoot()
  else if (name === 'gold') sfx.grabGold()
  else if (name === 'gem') sfx.grabGem()
  else if (name === 'rock') sfx.grabRock()
  else if (name === 'coin') sfx.coin()
  else if (name === 'clock') sfx.clock()
  else if (name === 'bomb') sfx.bomb()
  else if (name === 'success') sfx.success()
  else if (name === 'fail') sfx.fail()
  else sfx.tick()
  if (!save.mute && (name === 'coin' || name === 'gem' || name === 'bomb')) {
    try {
      navigator.vibrate?.(name === 'bomb' ? 16 : 10)
    } catch {
      /* some in-app browsers reject vibration */
    }
  }
}

function toggleMute(): void {
  const next = !save.mute
  if (next) sfx.ui()
  save.mute = next
  sfx.setMuted(save.mute)
  writeSave(save)
  renderMute()
  unlock()
  if (!save.mute) sfx.ui()
}

function renderMute(): void {
  el.mute.classList.toggle('muted', save.mute)
  el.mute.setAttribute('aria-label', save.mute ? '打开声音' : '关闭声音')
}

function unlock(): void {
  sfx.unlock()
}

function toast(message: string): void {
  el.toast.textContent = message
  el.toast.classList.add('show')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => el.toast.classList.remove('show'), 1600)
}

function nudge(node: HTMLElement): void {
  node.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-3px)' },
      { transform: 'translateX(3px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 220 },
  )
}

function startHero(): void {
  if (heroOn) return
  heroOn = true
  const loop = (time: number) => {
    if (!heroOn) return
    const ctx = heroContext()
    if (ctx) renderHero(ctx, el.hero.width / ratio(), el.hero.height / ratio(), time / 1000)
    heroRaf = requestAnimationFrame(loop)
  }
  paintHeroOnce()
  heroRaf = requestAnimationFrame(loop)
}

function stopHero(): void {
  heroOn = false
  cancelAnimationFrame(heroRaf)
}

function paintHeroOnce(): void {
  const ctx = heroContext()
  if (!ctx) return
  renderHero(ctx, el.hero.width / ratio(), el.hero.height / ratio(), 0.2)
}

function heroContext(): CanvasRenderingContext2D | null {
  const rect = el.hero.getBoundingClientRect()
  if (rect.width < 10) return null
  const dpr = ratio()
  const w = Math.round(rect.width * dpr)
  const h = Math.round(rect.height * dpr)
  if (el.hero.width !== w || el.hero.height !== h) {
    el.hero.width = w
    el.hero.height = h
  }
  const ctx = el.hero.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function ratio(): number {
  return Math.min(2, window.devicePixelRatio || 1)
}

function formatTime(value: number): string {
  const total = Math.max(0, Math.ceil(value))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function setText(node: HTMLElement, text: string): void {
  if (node.textContent !== text) node.textContent = text
}

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id)
  if (!node) throw new Error(`缺少界面节点 ${id}`)
  return node as T
}
