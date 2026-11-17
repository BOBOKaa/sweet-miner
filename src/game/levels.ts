import { extendCampaign } from './campaign'
import type { ItemType } from './tuning'

export type LevelItem = {
  type: ItemType
  x: number
  y: number
}

export type LevelDef = {
  name: string
  time: number
  /** New gold this stage adds. The number on screen is the running sum through this stage. */
  target: number
  /** Full left-right-left swing, in seconds. */
  period: number
  items: LevelItem[]
}

const HANDCRAFTED: LevelDef[] = [
  {
    name: '奶油浅滩',
    time: 50,
    target: 1280,
    period: 3.45,
    items: [
      { type: 'goldS', x: 0.32, y: 0.2 },
      { type: 'goldS', x: 0.68, y: 0.22 },
      { type: 'goldM', x: 0.5, y: 0.38 },
      { type: 'goldS', x: 0.2, y: 0.48 },
      { type: 'goldM', x: 0.8, y: 0.5 },
      { type: 'goldS', x: 0.38, y: 0.62 },
      { type: 'rockS', x: 0.66, y: 0.66 },
      { type: 'goldL', x: 0.48, y: 0.82 },
      { type: 'gem', x: 0.22, y: 0.84 },
      { type: 'bag', x: 0.76, y: 0.86 },
    ],
  },
  {
    name: '蜜桃坡',
    time: 48,
    target: 1880,
    period: 3.28,
    items: [
      { type: 'goldS', x: 0.26, y: 0.18 },
      { type: 'goldM', x: 0.5, y: 0.2 },
      { type: 'goldS', x: 0.76, y: 0.2 },
      { type: 'goldM', x: 0.18, y: 0.4 },
      { type: 'clock', x: 0.84, y: 0.38 },
      { type: 'gem', x: 0.62, y: 0.42 },
      { type: 'rockS', x: 0.4, y: 0.52 },
      { type: 'goldL', x: 0.28, y: 0.7 },
      { type: 'goldM', x: 0.72, y: 0.66 },
      { type: 'goldL', x: 0.52, y: 0.86 },
      { type: 'bag', x: 0.82, y: 0.84 },
    ],
  },
  {
    name: '樱花矿道',
    time: 48,
    target: 1520,
    period: 3.12,
    items: [
      { type: 'goldM', x: 0.5, y: 0.16 },
      { type: 'goldS', x: 0.24, y: 0.28 },
      { type: 'goldS', x: 0.76, y: 0.28 },
      { type: 'rockL', x: 0.5, y: 0.4 },
      { type: 'goldM', x: 0.2, y: 0.5 },
      { type: 'goldM', x: 0.82, y: 0.52 },
      { type: 'goldL', x: 0.5, y: 0.7 },
      { type: 'gem', x: 0.26, y: 0.78 },
      { type: 'goldL', x: 0.74, y: 0.76 },
      { type: 'bag', x: 0.46, y: 0.9 },
      { type: 'clock', x: 0.86, y: 0.34 },
    ],
  },
  {
    name: '薄荷晶洞',
    time: 46,
    target: 1860,
    period: 3.0,
    items: [
      { type: 'goldS', x: 0.4, y: 0.16 },
      { type: 'goldS', x: 0.64, y: 0.18 },
      { type: 'goldM', x: 0.22, y: 0.32 },
      { type: 'goldM', x: 0.78, y: 0.32 },
      { type: 'gem', x: 0.5, y: 0.34 },
      { type: 'rockS', x: 0.34, y: 0.5 },
      { type: 'goldL', x: 0.18, y: 0.62 },
      { type: 'rockL', x: 0.58, y: 0.52 },
      { type: 'gem', x: 0.72, y: 0.74 },
      { type: 'goldL', x: 0.4, y: 0.8 },
      { type: 'bag', x: 0.84, y: 0.58 },
      { type: 'clock', x: 0.62, y: 0.9 },
    ],
  },
  {
    name: '薰衣草层',
    time: 48,
    target: 1920,
    period: 2.9,
    items: [
      { type: 'candy', x: 0.5, y: 0.18 },
      { type: 'goldS', x: 0.22, y: 0.24 },
      { type: 'goldS', x: 0.8, y: 0.24 },
      { type: 'rockS', x: 0.34, y: 0.36 },
      { type: 'rockS', x: 0.66, y: 0.36 },
      { type: 'goldM', x: 0.18, y: 0.5 },
      { type: 'goldM', x: 0.5, y: 0.48 },
      { type: 'goldM', x: 0.82, y: 0.5 },
      { type: 'rockL', x: 0.38, y: 0.66 },
      { type: 'goldL', x: 0.22, y: 0.82 },
      { type: 'gem', x: 0.58, y: 0.78 },
      { type: 'star', x: 0.78, y: 0.7 },
      { type: 'bag', x: 0.48, y: 0.92 },
    ],
  },
  {
    name: '星星糖巷',
    time: 46,
    target: 2100,
    period: 2.76,
    items: [
      { type: 'goldM', x: 0.5, y: 0.16 },
      { type: 'star', x: 0.24, y: 0.28 },
      { type: 'goldS', x: 0.78, y: 0.22 },
      { type: 'goldL', x: 0.16, y: 0.48 },
      { type: 'rockL', x: 0.46, y: 0.4 },
      { type: 'goldM', x: 0.7, y: 0.42 },
      { type: 'gem', x: 0.56, y: 0.64 },
      { type: 'rockS', x: 0.3, y: 0.62 },
      { type: 'goldL', x: 0.82, y: 0.58 },
      { type: 'goldL', x: 0.36, y: 0.84 },
      { type: 'gem', x: 0.68, y: 0.86 },
      { type: 'bag', x: 0.16, y: 0.78 },
      { type: 'clock', x: 0.88, y: 0.36 },
    ],
  },
  {
    name: '月光井',
    time: 50,
    target: 3150,
    period: 2.56,
    items: [
      { type: 'goldM', x: 0.5, y: 0.14 },
      { type: 'goldS', x: 0.74, y: 0.18 },
      { type: 'candy', x: 0.28, y: 0.26 },
      { type: 'rockS', x: 0.4, y: 0.32 },
      { type: 'rockS', x: 0.62, y: 0.34 },
      { type: 'star', x: 0.16, y: 0.42 },
      { type: 'star', x: 0.84, y: 0.4 },
      { type: 'goldL', x: 0.32, y: 0.54 },
      { type: 'rockL', x: 0.55, y: 0.52 },
      { type: 'goldL', x: 0.78, y: 0.58 },
      { type: 'gem', x: 0.18, y: 0.74 },
      { type: 'goldL', x: 0.48, y: 0.78 },
      { type: 'gem', x: 0.8, y: 0.8 },
      { type: 'bag', x: 0.34, y: 0.92 },
      { type: 'clock', x: 0.66, y: 0.92 },
    ],
  },
  {
    name: '玫瑰深窟',
    time: 50,
    target: 3050,
    period: 2.46,
    items: [
      { type: 'goldS', x: 0.5, y: 0.14 },
      { type: 'candy', x: 0.5, y: 0.32 },
      { type: 'rockS', x: 0.32, y: 0.28 },
      { type: 'rockS', x: 0.68, y: 0.28 },
      { type: 'star', x: 0.16, y: 0.3 },
      { type: 'goldM', x: 0.84, y: 0.26 },
      { type: 'rockL', x: 0.24, y: 0.5 },
      { type: 'goldM', x: 0.5, y: 0.5 },
      { type: 'rockL', x: 0.76, y: 0.5 },
      { type: 'goldL', x: 0.16, y: 0.74 },
      { type: 'goldL', x: 0.42, y: 0.72 },
      { type: 'goldL', x: 0.7, y: 0.74 },
      { type: 'gem', x: 0.3, y: 0.9 },
      { type: 'gem', x: 0.58, y: 0.9 },
      { type: 'bag', x: 0.88, y: 0.88 },
      { type: 'clock', x: 0.92, y: 0.6 },
    ],
  },
  {
    name: '彩虹心脉',
    time: 56,
    target: 3550,
    period: 2.34,
    items: [
      { type: 'gem', x: 0.5, y: 0.16 },
      { type: 'star', x: 0.18, y: 0.26 },
      { type: 'star', x: 0.82, y: 0.26 },
      { type: 'candy', x: 0.5, y: 0.32 },
      { type: 'rockS', x: 0.28, y: 0.48 },
      { type: 'rockS', x: 0.72, y: 0.48 },
      { type: 'goldL', x: 0.12, y: 0.58 },
      { type: 'rockL', x: 0.5, y: 0.52 },
      { type: 'goldL', x: 0.88, y: 0.58 },
      { type: 'goldL', x: 0.3, y: 0.74 },
      { type: 'goldL', x: 0.7, y: 0.74 },
      { type: 'bag', x: 0.5, y: 0.74 },
      { type: 'gem', x: 0.5, y: 0.9 },
      { type: 'goldM', x: 0.16, y: 0.9 },
      { type: 'goldM', x: 0.84, y: 0.9 },
    ],
  },
  {
    name: '王冠宝库',
    time: 56,
    target: 4200,
    period: 2.26,
    items: [
      { type: 'goldM', x: 0.5, y: 0.12 },
      { type: 'gem', x: 0.28, y: 0.24 },
      { type: 'gem', x: 0.72, y: 0.24 },
      { type: 'star', x: 0.12, y: 0.32 },
      { type: 'star', x: 0.88, y: 0.32 },
      { type: 'bag', x: 0.5, y: 0.32 },
      { type: 'rockS', x: 0.36, y: 0.44 },
      { type: 'rockS', x: 0.64, y: 0.44 },
      { type: 'candy', x: 0.5, y: 0.5 },
      { type: 'goldL', x: 0.18, y: 0.56 },
      { type: 'goldL', x: 0.82, y: 0.56 },
      { type: 'rockL', x: 0.34, y: 0.72 },
      { type: 'rockL', x: 0.66, y: 0.72 },
      { type: 'gem', x: 0.5, y: 0.78 },
      { type: 'goldL', x: 0.16, y: 0.86 },
      { type: 'goldL', x: 0.84, y: 0.86 },
      { type: 'goldM', x: 0.38, y: 0.92 },
      { type: 'clock', x: 0.62, y: 0.92 },
    ],
  },
]

export const LEVELS: LevelDef[] = extendCampaign(HANDCRAFTED)

/** Pass line shown in the HUD: every earlier stage's new gold, plus this one. */
export function cumulativeTarget(index: number): number {
  let total = 0
  for (let i = 0; i <= index && i < LEVELS.length; i++) total += LEVELS[i].target
  return total
}
