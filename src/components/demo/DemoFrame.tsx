'use client'

import { useEffect, useMemo, useState } from 'react'

export type DemoFrameProps = {
  src: string
  title?: string
  height?: number
}

export function DemoFrame({ src, title, height }: DemoFrameProps) {
  const initialHeight = useMemo(() => (height && height > 0 ? height : 720), [height])
  const [frameHeight, setFrameHeight] = useState(initialHeight)
  const expectedOrigin = useMemo(() => {
    try {
      return new URL(src, window.location.href).origin
    } catch {
      return null
    }
  }, [src])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (expectedOrigin && event.origin !== expectedOrigin) return
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (data.type !== 'demo:resize') return
      const nextHeight = Number(data.height)
      if (!Number.isFinite(nextHeight)) return
      const clamped = Math.max(120, Math.min(2000, Math.round(nextHeight)))
      setFrameHeight(clamped)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [expectedOrigin])

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe
        title={title ?? 'Demo'}
        src={src}
        style={{
          width: '100%',
          height: frameHeight,
          border: 'none',
          background: '#ffffff',
          display: 'block',
          margin: 0,
          padding: 0,
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}
