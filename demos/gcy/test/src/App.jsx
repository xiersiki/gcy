import React, { useEffect, useState } from 'react'

export default function App({ onChange }) {
  const [count, setCount] = useState(0)
  const [boxHeight, setBoxHeight] = useState(180)
  useEffect(() => {
    if (typeof onChange === "function") onChange()
  }, [count, boxHeight, onChange])

  return (
    <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}>
      <div style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, padding: 16, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>React Demo（独立包 + iframe 隔离）</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setCount((v) => v - 1)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.2)", background: "transparent", cursor: "pointer" }}>-1</button>
          <div style={{ fontVariantNumeric: "tabular-nums", fontSize: 24 }}>{count}</div>
          <button type="button" onClick={() => setCount((v) => v + 1)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.2)", background: "transparent", cursor: "pointer" }}>+1</button>
        </div>
        <div style={{ height: 12 }} />
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label htmlFor="range">渐变块高度</label>
          <input id="range" type="range" min="120" max="520" value={boxHeight} onChange={(e) => setBoxHeight(Number(e.target.value))} />
          <span style={{ opacity: 0.72, fontSize: 12 }}>{boxHeight}px</span>
        </div>
        <div style={{ height: 12 }} />
        <div style={{ height: boxHeight, width: "100%", borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }} />
        <div style={{ height: 12 }} />
        <div style={{ opacity: 0.72, fontSize: 12 }}>这个 demo 会向父页面 postMessage 高度用于自适应。</div>
      </div>
    </div>
  )
}
