import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

function postResize() {
  const height = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
    document.documentElement.offsetHeight,
    document.body?.offsetHeight ?? 0,
  )
  let targetOrigin = '*'
  try {
    if (document.referrer) targetOrigin = new URL(document.referrer).origin
  } catch {}
  window.parent?.postMessage({ type: 'demo:resize', height }, targetOrigin)
}

const rootEl = document.getElementById('root')
const root = createRoot(rootEl)
root.render(<App onChange={() => postResize()} />)

window.addEventListener("load", postResize)
window.addEventListener("resize", postResize)
