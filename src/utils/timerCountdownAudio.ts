type CountdownAudioKind = 'focus' | 'break'

const COUNTDOWN_AUDIO_SRC: Record<CountdownAudioKind, string> = {
  focus: '/audio/focus-end-countdown-5s.m4a',
  break: '/audio/break-end-countdown-10s.m4a',
}

const players: Partial<Record<CountdownAudioKind, HTMLAudioElement>> = {}

function getPlayer(kind: CountdownAudioKind) {
  if (typeof window === 'undefined') return null

  players[kind] ??= new Audio(COUNTDOWN_AUDIO_SRC[kind])
  const player = players[kind]!
  player.preload = 'auto'
  player.volume = kind === 'focus' ? 0.72 : 0.65
  return player
}

export function unlockTimerCountdownAudio() {
  const player = getPlayer('focus')
  const breakPlayer = getPlayer('break')

  for (const item of [player, breakPlayer]) {
    if (!item) continue
    item.load()
  }
}

export function playTimerCountdownAudio(kind: CountdownAudioKind) {
  const player = getPlayer(kind)
  if (!player) return

  player.pause()
  player.currentTime = 0
  void player.play().catch(() => undefined)
}

export function stopTimerCountdownAudio() {
  Object.values(players).forEach((player) => {
    if (!player) return
    player.pause()
    player.currentTime = 0
  })
}
