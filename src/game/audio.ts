type OscKind = OscillatorType

export class Sfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  muted = false

  unlock(): void {
    const AC = audioCtor()
    if (!AC) return
    if (!this.ctx) {
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.2
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.master) this.master.gain.value = muted ? 0 : 0.2
  }

  shoot(): void {
    this.tone(620, 0.09, 'triangle', 0.12, 0, 280)
    this.noise(0.05, 0.03, 0)
  }

  grabGold(): void {
    this.tone(523, 0.09, 'sine', 0.1, 0)
    this.tone(659, 0.1, 'sine', 0.09, 0.06)
    this.tone(784, 0.14, 'triangle', 0.08, 0.12)
  }

  grabGem(): void {
    this.tone(880, 0.08, 'sine', 0.09, 0)
    this.tone(1175, 0.1, 'sine', 0.08, 0.05)
    this.tone(1568, 0.16, 'triangle', 0.07, 0.1)
  }

  grabRock(): void {
    this.tone(150, 0.12, 'sine', 0.1, 0, 90)
    this.noise(0.08, 0.04, 0)
  }

  coin(): void {
    this.tone(990, 0.07, 'triangle', 0.08, 0)
    this.tone(1320, 0.1, 'sine', 0.06, 0.05)
  }

  clock(): void {
    this.tone(660, 0.08, 'sine', 0.08, 0)
    this.tone(880, 0.12, 'triangle', 0.07, 0.07)
  }

  bomb(): void {
    this.noise(0.16, 0.08, 0)
    this.tone(220, 0.18, 'sine', 0.1, 0, 70)
  }

  success(): void {
    const notes = [523, 659, 784, 1046]
    notes.forEach((n, i) => this.tone(n, 0.18, 'triangle', 0.08, i * 0.09))
  }

  fail(): void {
    this.tone(494, 0.16, 'sine', 0.07, 0)
    this.tone(392, 0.18, 'sine', 0.06, 0.12)
    this.tone(330, 0.22, 'triangle', 0.05, 0.24)
  }

  ui(): void {
    this.tone(740, 0.05, 'sine', 0.05, 0)
  }

  buy(): void {
    this.tone(880, 0.07, 'triangle', 0.07, 0)
    this.tone(1175, 0.1, 'sine', 0.06, 0.06)
  }

  tick(): void {
    this.tone(880, 0.04, 'sine', 0.03, 0)
  }

  private tone(
    freq: number,
    dur: number,
    type: OscKind,
    gain: number,
    delay: number,
    slideTo?: number,
  ): void {
    if (!this.ctx || !this.master) return
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
    amp.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private noise(dur: number, gain: number, delay: number): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + delay
    const frames = Math.max(1, Math.floor(this.ctx.sampleRate * dur))
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 400
    const amp = this.ctx.createGain()
    amp.gain.setValueAtTime(gain, t)
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filter)
    filter.connect(amp)
    amp.connect(this.master)
    src.start(t)
    src.stop(t + dur + 0.02)
  }
}

function audioCtor(): typeof AudioContext | null {
  const w = window as Window & { webkitAudioContext?: typeof AudioContext }
  return window.AudioContext ?? w.webkitAudioContext ?? null
}
