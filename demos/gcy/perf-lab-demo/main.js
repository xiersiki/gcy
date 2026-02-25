const app = document.querySelector('#app')

function postResize() {
  const height = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0)
  let targetOrigin = '*'
  try {
    if (document.referrer) targetOrigin = new URL(document.referrer).origin
  } catch {}
  window.parent?.postMessage({ type: 'demo:resize', height }, targetOrigin)
}

function render() {
  let count = 200
  app.innerHTML = `
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui; background: #f8fafc; color: #0f172a; }
      .wrap { padding: 16px; max-width: 900px; margin: 0 auto; }
      .card { border: 1px solid #cbd5e1; border-radius: 12px; background: white; padding: 16px; }
      .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
      .list { border: 1px dashed #cbd5e1; border-radius: 10px; height: 280px; overflow: auto; padding: 8px; }
      .item { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      button { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 6px 10px; cursor: pointer; }
      .muted { color: #64748b; font-size: 12px; }
    </style>
    <div class="wrap">
      <div class="card">
        <h2>Perf Lab Demo</h2>
        <div class="row">
          <button id="minus">-100</button>
          <div>Items: <strong id="count">${count}</strong></div>
          <button id="plus">+100</button>
        </div>
        <div class="list" id="list"></div>
        <p class="muted">This lightweight demo simulates list scaling pressure for profiling practice.</p>
      </div>
    </div>
  `

  const countEl = document.querySelector('#count')
  const listEl = document.querySelector('#list')

  const paint = () => {
    countEl.textContent = String(count)
    listEl.innerHTML = Array.from({ length: count })
      .map((_, i) => `<div class="item">Row ${i + 1} · render cost probe</div>`)
      .join('')
    postResize()
  }

  document.querySelector('#minus').addEventListener('click', () => {
    count = Math.max(100, count - 100)
    paint()
  })
  document.querySelector('#plus').addEventListener('click', () => {
    count = Math.min(1000, count + 100)
    paint()
  })

  paint()
  window.addEventListener('resize', postResize)
}

render()
