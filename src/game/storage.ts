import { emptyBuffs, type Buffs } from './tuning'

const KEY = 'sweet-miner-v1'

export type RunSave = {
  level: number
  money: number
  bombs: number
  buffs: Buffs
  needsShop: boolean
}

export type SaveData = {
  bestLevel: number
  bestMoney: number
  stars: number[]
  mute: boolean
  run: RunSave | null
}

export function freshSave(): SaveData {
  return {
    bestLevel: 0,
    bestMoney: 0,
    stars: Array.from({ length: 10 }, () => 0),
    mute: false,
    run: null,
  }
}

export function freshRun(): RunSave {
  return {
    level: 1,
    money: 0,
    bombs: 0,
    buffs: emptyBuffs(),
    needsShop: false,
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshSave()
    const parsed = JSON.parse(raw) as Partial<SaveData>
    const stars = Array.isArray(parsed.stars) ? parsed.stars.slice(0, 10) : []
    while (stars.length < 10) stars.push(0)
    return {
      bestLevel: clampNum(parsed.bestLevel, 0, 10),
      bestMoney: clampNum(parsed.bestMoney, 0, 999999),
      stars: stars.map((n) => clampNum(n, 0, 3)),
      mute: Boolean(parsed.mute),
      run: sanitizeRun(parsed.run),
    }
  } catch {
    return freshSave()
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* private mode or full storage — the run still works */
  }
}

function sanitizeRun(run: RunSave | null | undefined): RunSave | null {
  if (!run || typeof run !== 'object') return null
  const level = clampNum(run.level, 1, 10)
  const buffs = run.buffs ?? emptyBuffs()
  return {
    level,
    money: clampNum(run.money, 0, 999999),
    bombs: clampNum(run.bombs, 0, 9),
    needsShop: Boolean(run.needsShop),
    buffs: {
      strength: Boolean(buffs.strength),
      clover: Boolean(buffs.clover),
      extraTime: buffs.extraTime >= 30 ? 30 : buffs.extraTime >= 15 ? 15 : 0,
    },
  }
}

function clampNum(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : min
  return Math.max(min, Math.min(max, Math.round(n)))
}
