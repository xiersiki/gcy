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
  app.innerHTML = `
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui; background: #f8fafc; color: #0f172a; }
      .wrap { max-width: 720px; margin: 0 auto; padding: 16px; }
      .card { border: 1px solid #cbd5e1; border-radius: 12px; background: white; padding: 16px; }
      .field { margin-bottom: 12px; }
      label { display: block; font-size: 13px; margin-bottom: 6px; }
      input, select { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; box-sizing: border-box; }
      .error { font-size: 12px; color: #dc2626; }
      button { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 6px 12px; cursor: pointer; }
      .muted { color: #64748b; font-size: 12px; }
    </style>
    <div class="wrap">
      <div class="card">
        <h2>Form Schema Demo</h2>
        <div class="field">
          <label>Project Name</label>
          <input id="name" placeholder="Enter project name" />
          <div id="nameErr" class="error"></div>
        </div>
        <div class="field">
          <label>Complexity</label>
          <select id="level">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <button id="submit">Validate</button>
        <p id="out" class="muted"></p>
      </div>
    </div>
  `

  const nameInput = document.querySelector('#name')
  const nameErr = document.querySelector('#nameErr')
  const levelSelect = document.querySelector('#level')
  const out = document.querySelector('#out')

  document.querySelector('#submit').addEventListener('click', () => {
    const name = nameInput.value.trim()
    const level = levelSelect.value
    if (name.length < 3) {
      nameErr.textContent = 'Project Name must be at least 3 chars.'
      out.textContent = ''
      return
    }
    nameErr.textContent = ''
    out.textContent = `Payload => { name: "${name}", level: "${level}" }`
    postResize()
  })

  postResize()
  window.addEventListener('resize', postResize)
}

render()
