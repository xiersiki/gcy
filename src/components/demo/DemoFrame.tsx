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

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
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
  }, [])

  return (
    <div style={{ width: '100%', margin: '24px 0' }}>
      <iframe
        title={title ?? 'Demo'}
        src={src}
        style={{
          width: '100%',
          height: frameHeight,
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 12,
          background: 'transparent',
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}
