export const DW = 390

export const ORIGIN_X = 195
export const PLAY_LEFT = 28
export const PLAY_RIGHT = 362
export const PLAY_GAP = 50
export const PLAY_HEIGHT = 380
export const GROUND_PAD = 12
/** Rope origin sits this far below the HUD so the miner fits underneath it. */
export const ORIGIN_BELOW_HUD = 112

export const AMP = 1.16
export const HOOK_R = 8
export const REST_LEN = 48
export const EXTEND_SPEED = 430
export const RETRACT_SPEED = 450
export const CANDY_RADIUS = 118
export const STRENGTH_MUL = 1.82
export const CLOVER_MUL = 1.5
export const CLOCK_BONUS = 8
export const STAR_AMP = 20

export type ItemType =
  | 'goldS'
  | 'goldM'
  | 'goldL'
  | 'gem'
  | 'rockS'
  | 'rockL'
  | 'bag'
  | 'clock'
  | 'star'
  | 'candy'

export type Mood = 'idle' | 'happy' | 'wow' | 'pout' | 'effort'

export type ItemStat = {
  value: number
  weight: number
  r: number
  name: string
}

export const STATS: Record<ItemType, ItemStat> = {
  goldS: { value: 50, weight: 1, r: 15, name: '小金块' },
  goldM: { value: 160, weight: 2.05, r: 22, name: '金块' },
  goldL: { value: 430, weight: 3.7, r: 31, name: '大金块' },
  gem: { value: 700, weight: 0.46, r: 13, name: '钻石' },
  rockS: { value: 8, weight: 3.2, r: 17, name: '小石头' },
  rockL: { value: 16, weight: 5.6, r: 28, name: '大石头' },
  bag: { value: 0, weight: 1.25, r: 17, name: '福袋' },
  clock: { value: 0, weight: 0.82, r: 15, name: '时钟' },
  star: { value: 330, weight: 0.58, r: 13, name: '星砂' },
  candy: { value: 70, weight: 0.88, r: 16, name: '爆爆糖' },
}

export const BAG_TABLE = [80, 110, 140, 170, 200, 240, 300, 460]

export const SHOP = {
  bomb: { price: 80, name: '小炸弹', desc: '拉住石头时点一下，石头就会松开' },
  strength: { price: 150, name: '力量汽水', desc: '这一关拉绳更快，重的也不怕' },
  clover: { price: 220, name: '幸运草', desc: '这一关收下的金币 ×1.5' },
  time: { price: 100, name: '时光沙漏', desc: '这一关多 15 秒，可以买两次' },
} as const

export const TIME_BONUS_STEP = 15
export const TIME_BONUS_MAX = 30

export function emptyBuffs(): Buffs {
  return { strength: false, clover: false, extraTime: 0 }
}

export type Buffs = {
  strength: boolean
  clover: boolean
  extraTime: number
}
