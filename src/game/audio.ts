type OscKind = OscillatorType

const MUSIC_GAIN = 0.2
const SFX_GAIN = 0.5

/**
 * Procedural chimes and a short original loop.
 * The first tap has to resume the audio context; sounds scheduled before that
 * are queued so they are not dropped on mobile browsers.
 */
export class Sfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private sfxBus: GainNode | null = null
  private music: AudioBufferSourceNode | null = null
  private pending: Array<() => void> = []
  private resume: Promise<void> | null = null
  muted = false
  private musicPaused = false

  unlock(): void {
    const AC = audioCtor()
    if (!AC) return
    this.ensure(AC)
    const ctx = this.ctx
    if (!ctx) return
    if (ctx.state === 'running') {
      this.flush()
      this.startMusic()
      return
    }
    if (this.resume) return
    this.resume = ctx
      .resume()
      .then(() => {
        this.resume = null
        if (this.ctx?.state === 'running') {
          this.flush()
          this.startMusic()
        }
      })
      .catch(() => {
        this.resume = null
      })
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.applyMaster()
    if (!muted) this.unlock()
  }

  setMusicPaused(paused: boolean): void {
    this.musicPaused = paused
    this.applyMusic()
  }

  shoot(): void {
    this.tone(680, 0.1, 'triangle', 0.16, 0, 360)
    this.tone(980, 0.12, 'sine', 0.06, 0.04)
  }

  grabGold(): void {
    this.tone(523, 0.09, 'sine', 0.14, 0)
    this.tone(659, 0.11, 'sine', 0.12, 0.06)
    this.tone(784, 0.16, 'triangle', 0.1, 0.12)
  }

  grabGem(): void {
    this.tone(880, 0.08, 'sine', 0.12, 0)
    this.tone(1175, 0.11, 'sine', 0.1, 0.05)
    this.tone(1568, 0.18, 'triangle', 0.08, 0.1)
  }

  grabRock(): void {
    this.tone(180, 0.14, 'sine', 0.12, 0, 90)
    this.noise(0.08, 0.05, 0)
  }

  coin(): void {
    this.tone(988, 0.07, 'triangle', 0.12, 0)
    this.tone(1319, 0.12, 'sine', 0.08, 0.05)
  }

  clock(): void {
    this.tone(660, 0.08, 'sine', 0.1, 0)
    this.tone(880, 0.12, 'triangle', 0.08, 0.07)
  }

  bomb(): void {
    this.noise(0.16, 0.09, 0)
    this.tone(220, 0.18, 'sine', 0.12, 0, 70)
  }

  success(): void {
    const notes = [523, 659, 784, 1046]
    notes.forEach((note, index) => this.tone(note, 0.2, 'triangle', 0.11, index * 0.09))
  }

  fail(): void {
    this.tone(494, 0.16, 'sine', 0.09, 0)
    this.tone(392, 0.18, 'sine', 0.08, 0.12)
    this.tone(330, 0.24, 'triangle', 0.07, 0.24)
  }

  ui(): void {
    this.tone(784, 0.05, 'sine', 0.07, 0)
  }

  buy(): void {
    this.tone(880, 0.08, 'triangle', 0.1, 0)
    this.tone(1175, 0.12, 'sine', 0.08, 0.06)
  }

  tick(): void {
    this.tone(880, 0.045, 'sine', 0.045, 0)
  }

  private ensure(AC: typeof AudioContext): void {
    if (this.ctx) return
    let ctx: AudioContext
    try {
      ctx = new AC()
    } catch {
      return
    }
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : 1
    master.connect(ctx.destination)
    const musicBus = ctx.createGain()
    musicBus.gain.value = this.musicPaused ? 0.0001 : MUSIC_GAIN
    musicBus.connect(master)
    const sfxBus = ctx.createGain()
    sfxBus.gain.value = SFX_GAIN
    sfxBus.connect(master)
    const silent = ctx.createBuffer(1, 1, ctx.sampleRate)
    const pop = ctx.createBufferSource()
    pop.buffer = silent
    pop.connect(master)
    pop.start()
    this.ctx = ctx
    this.master = master
    this.musicBus = musicBus
    this.sfxBus = sfxBus
  }

  private applyMaster(): void {
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.03)
  }

  private applyMusic(): void {
    if (!this.ctx || !this.musicBus) return
    const now = this.ctx.currentTime
    this.musicBus.gain.cancelScheduledValues(now)
    this.musicBus.gain.setTargetAtTime(this.musicPaused ? 0.0001 : MUSIC_GAIN, now, 0.08)
  }

  private flush(): void {
    const queued = this.pending.splice(0)
    for (const play of queued) play()
  }

  private whenRunning(play: () => void): void {
    if (this.muted) return
    if (this.ctx?.state === 'running') {
      play()
      return
    }
    if (this.pending.length > 8) this.pending.shift()
    this.pending.push(play)
    this.unlock()
  }

  private startMusic(): void {
    if (!this.ctx || !this.musicBus || this.music || this.ctx.state !== 'running') return
    const rendered = renderLoop(this.ctx.sampleRate)
    const buffer = this.ctx.createBuffer(1, rendered.length, this.ctx.sampleRate)
    buffer.getChannelData(0).set(rendered)
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2400
    filter.Q.value = 0.4
    source.connect(filter)
    filter.connect(this.musicBus)
    source.start()
    this.music = source
    this.applyMusic()
  }

  private tone(freq: number, dur: number, type: OscKind, gain: number, delay: number, slideTo?: number): void {
    this.whenRunning(() => {
      try {
        this.playTone(freq, dur, type, gain, delay, slideTo)
      } catch {
        /* a dropped blip should not stop the game */
      }
    })
  }

  private playTone(freq: number, dur: number, type: OscKind, gain: number, delay: number, slideTo?: number): void {
    if (!this.ctx || !this.sfxBus) return
    const t = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const amp = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur)
    amp.gain.setValueAtTime(0.0001, t)
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.015)
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(amp)
    amp.connect(this.sfxBus)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private noise(dur: number, gain: number, delay: number): void {
    this.whenRunning(() => {
      if (!this.ctx || !this.sfxBus) return
      const t = this.ctx.currentTime + delay
      const frames = Math.max(1, Math.floor(this.ctx.sampleRate * dur))
      const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
      const src = this.ctx.createBufferSource()
      src.buffer = buffer
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = 500
      const amp = this.ctx.createGain()
      amp.gain.setValueAtTime(gain, t)
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      src.connect(filter)
      filter.connect(amp)
      amp.connect(this.sfxBus)
      src.start(t)
      src.stop(t + dur + 0.02)
    })
  }
}

function audioCtor(): typeof AudioContext | null {
  const w = window as Window & { webkitAudioContext?: typeof AudioContext }
  return window.AudioContext ?? w.webkitAudioContext ?? null
}

function midi(note: number): number {
  return 440 * 2 ** ((note - 69) / 12)
}

function renderLoop(sampleRate: number): Float32Array {
  const bpm = 76
  const beat = 60 / bpm
  const beats = 32
  const length = Math.floor(beats * beat * sampleRate)
  const data = new Float32Array(length)
  const write = (freq: number, startBeat: number, noteBeats: number, gain: number, soft: boolean) => {
    const start = Math.floor(startBeat * beat * sampleRate)
    const noteLength = Math.floor(noteBeats * beat * sampleRate)
    const attack = Math.floor(sampleRate * (soft ? 0.08 : 0.03))
    const release = Math.floor(sampleRate * (soft ? 0.18 : 0.12))
    for (let i = 0; i < noteLength; i++) {
      const index = start + i
      if (index < 0 || index >= data.length) continue
      const env = Math.min(1, i / Math.max(1, attack)) * Math.min(1, (noteLength - i) / Math.max(1, release))
      data[index] += Math.sin((2 * Math.PI * freq * i) / sampleRate) * env * gain
    }
  }
  const melody: Array<[number, number]> = [
    [65, 1],
    [69, 1],
    [72, 1],
    [69, 1],
    [67, 1],
    [69, 0.5],
    [67, 0.5],
    [65, 1],
    [64, 1],
    [65, 1],
    [69, 1],
    [72, 1],
    [74, 1],
    [72, 1],
    [69, 1],
    [67, 1],
    [65, 1],
    [72, 1],
    [74, 1],
    [72, 1],
    [69, 1],
    [67, 1],
    [69, 1],
    [65, 2],
    [64, 1],
    [65, 1],
    [67, 1],
    [69, 1],
    [67, 1],
    [65, 1],
    [64, 1],
    [65, 1],
  ]
  let cursor = 0
  for (const [note, duration] of melody) {
    write(midi(note), cursor, duration * 0.92, 0.16, false)
    cursor += duration
  }
  const pads: Array<[number, number, number[]]> = [
    [0, 8, [53, 57, 60]],
    [8, 8, [48, 55, 60]],
    [16, 8, [53, 57, 60]],
    [24, 8, [48, 52, 55]],
  ]
  for (const [start, duration, chord] of pads) {
    for (const note of chord) write(midi(note), start, duration, 0.045, true)
  }
  const fade = Math.floor(sampleRate * 0.03)
  let peak = 0
  for (let i = 0; i < data.length; i++) {
    const edge = Math.min(1, i / fade, (data.length - i) / fade)
    data[i] *= edge
    peak = Math.max(peak, Math.abs(data[i]))
  }
  if (peak > 0.55) {
    const gain = 0.55 / peak
    for (let i = 0; i < data.length; i++) data[i] *= gain
  }
  return data
}
