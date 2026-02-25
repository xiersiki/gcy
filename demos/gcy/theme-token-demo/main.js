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
  let dark = false

  app.innerHTML = `
    <style>
      :root {
        --bg: #ffffff;
        --surface: #f8fafc;
        --text: #0f172a;
        --primary: #0284c7;
      }
      .dark {
        --bg: #0b1220;
        --surface: #172033;
        --text: #e2e8f0;
        --primary: #38bdf8;
      }
      body { margin: 0; font-family: ui-sans-serif, system-ui; background: var(--bg); color: var(--text); }
      .wrap { max-width: 760px; margin: 0 auto; padding: 16px; }
      .card { border: 1px solid color-mix(in srgb, var(--text), transparent 80%); border-radius: 12px; background: var(--surface); padding: 16px; }
      .btn { border: 1px solid var(--primary); border-radius: 8px; background: var(--primary); color: white; padding: 6px 12px; cursor: pointer; }
      .token { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    </style>
    <div class="wrap" id="wrap">
      <div class="card">
        <h2>Theme Token Demo</h2>
        <p>Toggle semantic token values and inspect component visual response.</p>
        <button class="btn" id="toggle">Toggle Theme</button>
        <pre class="token" id="token"></pre>
      </div>
    </div>
  `

  const wrap = document.querySelector('#wrap')
  const token = document.querySelector('#token')
  const sync = () => {
    wrap.classList.toggle('dark', dark)
    token.textContent = `--bg=${dark ? '#0b1220' : '#ffffff'}\n--surface=${dark ? '#172033' : '#f8fafc'}\n--text=${dark ? '#e2e8f0' : '#0f172a'}\n--primary=${dark ? '#38bdf8' : '#0284c7'}`
    postResize()
  }

  document.querySelector('#toggle').addEventListener('click', () => {
    dark = !dark
    sync()
  })

  sync()
  window.addEventListener('resize', postResize)
}

render()
