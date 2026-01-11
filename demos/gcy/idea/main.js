const app = document.querySelector('#app')

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

function createStyle() {
  const style = document.createElement("style")
  style.textContent = `
    :root { color-scheme: light dark; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    .wrap { padding: 16px; }
    .card { border: 1px solid rgba(0,0,0,.12); border-radius: 12px; padding: 16px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    button { padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(0,0,0,.2); background: transparent; cursor: pointer; }
    .value { font-variant-numeric: tabular-nums; font-size: 24px; }
    .box { height: var(--h); width: 100%; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #06b6d4); }
    .muted { opacity: .72; font-size: 12px; }
  `
  document.head.appendChild(style)
}

function render() {
  let count = 0
  let boxHeight = 180

  createStyle()

  app.innerHTML = `
    <div class="wrap">
      <div class="card">
        <h1>交互 Demo（独立包 + iframe 隔离）</h1>
        <div class="row">
          <button id="dec" type="button">-1</button>
          <div class="value" id="count">${count}</div>
          <button id="inc" type="button">+1</button>
        </div>

        <div style="height: 12px"></div>

        <div class="row">
          <label for="range">渐变块高度</label>
          <input id="range" type="range" min="120" max="520" value="${boxHeight}" />
          <span class="muted" id="rangeValue">${boxHeight}px</span>
        </div>

        <div style="height: 12px"></div>
        <div class="box" id="box" style="--h: ${boxHeight}px"></div>
        <div style="height: 12px"></div>
        <div class='muted'>这个 demo 会向父页面 postMessage 高度用于自适应。</div>
      </div>
    </div>
  `

  const countEl = document.querySelector('#count')
  const boxEl = document.querySelector('#box')
  const rangeEl = document.querySelector('#range')
  const rangeValueEl = document.querySelector('#rangeValue')

  document.querySelector('#dec').addEventListener('click', () => {
    count -= 1
    countEl.textContent = String(count)
    postResize()
  })

  document.querySelector('#inc').addEventListener('click', () => {
    count += 1
    countEl.textContent = String(count)
    postResize()
  })

  rangeEl.addEventListener("input", () => {
    boxHeight = Number(rangeEl.value)
    boxEl.style.setProperty('--h', `${boxHeight}px`)
    rangeValueEl.textContent = `${boxHeight}px`
    postResize()
  })

  const ro = new ResizeObserver(() => postResize())
  ro.observe(document.documentElement)

  window.addEventListener("load", postResize)
  window.addEventListener("resize", postResize)
  postResize()
}

render()
