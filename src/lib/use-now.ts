'use client'

import { useEffect, useState } from 'react'

// Current time on the client, refreshed every `intervalMs`.
// Returns null during server render/prerender so pages don't show (or
// mismatch on) the build-time date.
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
