let audioContext: AudioContext | null = null

type WindowWithWebAudio = Window & {
  webkitAudioContext?: typeof AudioContext
}

function getAudioContext() {
  if (typeof window === 'undefined') return null

  const AudioContextCtor = window.AudioContext ?? (window as WindowWithWebAudio).webkitAudioContext
  if (!AudioContextCtor) return null

  audioContext ??= new AudioContextCtor()
  return audioContext
}

export function unlockTimerChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined)
  }

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  gain.gain.value = 0
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.01)
}

export function playTimerChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    void ctx.resume().then(playTimerChime).catch(() => undefined)
    return
  }

  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.035)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
  master.connect(ctx.destination)

  const notes = [
    { frequency: 659.25, delay: 0, duration: 0.72, type: 'sine' as OscillatorType },
    { frequency: 987.77, delay: 0.14, duration: 0.82, type: 'triangle' as OscillatorType },
  ]

  notes.forEach(({ frequency, delay, duration, type }) => {
    const start = now + delay
    const end = start + duration
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.985, end)

    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.55, start + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(start)
    oscillator.stop(end + 0.04)
  })

  window.setTimeout(() => master.disconnect(), 1400)
}
