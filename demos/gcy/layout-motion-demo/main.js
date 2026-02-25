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
  const groups = {
    all: ['Card A', 'Card B', 'Card C', 'Card D', 'Card E', 'Card F'],
    core: ['Card A', 'Card C', 'Card E'],
    aux: ['Card B', 'Card D', 'Card F'],
  }
  let active = 'all'

  app.innerHTML = `
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui; background: #f8fafc; color: #0f172a; }
      .wrap { max-width: 900px; margin: 0 auto; padding: 16px; }
      .toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
      button { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 6px 10px; cursor: pointer; }
      .active { background: #0ea5e9; color: white; border-color: #0ea5e9; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .item { border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; padding: 18px 12px; text-align: center; transition: transform .2s ease, opacity .2s ease; }
      .muted { color: #64748b; font-size: 12px; margin-top: 10px; }
    </style>
    <div class="wrap">
      <h2>Layout Motion Demo</h2>
      <div class="toolbar">
        <button data-key="all" class="active">All</button>
        <button data-key="core">Core</button>
        <button data-key="aux">Aux</button>
      </div>
      <div class="grid" id="grid"></div>
      <p class="muted">Use this demo to inspect reordering transitions under filtering.</p>
    </div>
  `

  const grid = document.querySelector('#grid')
  const buttons = Array.from(document.querySelectorAll('button[data-key]'))
  const paint = () => {
    grid.innerHTML = groups[active].map((name) => `<div class="item">${name}</div>`).join('')
    buttons.forEach((btn) => btn.classList.toggle('active', btn.dataset.key === active))
    postResize()
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      active = btn.dataset.key
      paint()
    })
  })

  paint()
  window.addEventListener('resize', postResize)
}

render()
