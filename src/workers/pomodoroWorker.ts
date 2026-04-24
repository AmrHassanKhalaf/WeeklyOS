let intervalId: ReturnType<typeof setInterval> | null = null

self.onmessage = (event: MessageEvent<string>) => {
  if (event.data === 'start') {
    if (intervalId) return
    intervalId = setInterval(() => {
      self.postMessage('tick')
    }, 1000)
    return
  }

  if (event.data === 'stop' && intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
