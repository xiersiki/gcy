import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

function getArg(flag) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return undefined
  return process.argv[idx + 1]
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

function parseIntArg(value, fallback) {
  if (!value) return fallback
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : fallback
}

function normalizeId(value) {
  const v = String(value ?? '').trim()
  if (!/^[a-z0-9][a-z0-9-]*$/.test(v)) {
    throw new Error(`Invalid id: "${v}". Use lowercase letters, digits and "-".`)
  }
  return v
}

async function pathExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function mkdirp(p) {
  await fs.mkdir(p, { recursive: true })
}

async function listDirSafe(p) {
  return await fs.readdir(p).catch(() => [])
}

async function writeFileSafe(filePath, content, { force }) {
  if (!force && (await pathExists(filePath))) return false
  await mkdirp(path.dirname(filePath))
  await fs.writeFile(filePath, content, 'utf8')
  return true
}

function formatDateISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function createDemoPackageJson({ authorId, slug, port }) {
  const previewPort = Math.max(1024, port - 1000)
  return JSON.stringify(
    {
      name: `@demo/${authorId}-${slug}`,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: `vite --port ${port} --strictPort`,
        build: 'vite build',
        preview: `vite preview --port ${previewPort}`,
      },
      devDependencies: {
        vite: '^5.4.21',
      },
    },
    null,
    2,
  )
}

function createViteConfig() {
  return [
    "import { defineConfig } from 'vite'",
    '',
    'export default defineConfig({',
    "  base: './',",
    '})',
    '',
  ].join('\n')
}

function createIndexHtml({ title }) {
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${title}</title>`,
    '  </head>',
    '  <body>',
    '    <div id="app"></div>',
    '    <script type="module" src="/main.js"></script>',
    '  </body>',
    '</html>',
    '',
  ].join('\n')
}

function createMainJs({ title }) {
  return [
    "const app = document.querySelector('#app')",
    '',
    'function postResize() {',
    '  const height = Math.max(',
    '    document.documentElement.scrollHeight,',
    '    document.body?.scrollHeight ?? 0,',
    '    document.documentElement.offsetHeight,',
    '    document.body?.offsetHeight ?? 0,',
    '  )',
    "  let targetOrigin = '*'",
    '  try {',
    '    if (document.referrer) targetOrigin = new URL(document.referrer).origin',
    '  } catch {}',
    "  window.parent?.postMessage({ type: 'demo:resize', height }, targetOrigin)",
    '}',
    '',
    'function createStyle() {',
    "  const style = document.createElement('style')",
    '  style.textContent = `',
    '    :root { color-scheme: light dark; }',
    '    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }',
    '    .wrap { padding: 16px; }',
    '    .card { border: 1px solid rgba(0,0,0,.12); border-radius: 12px; padding: 16px; max-width: 720px; margin: 0 auto; }',
    '    h1 { font-size: 18px; margin: 0 0 12px; }',
    '    .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }',
    '    button { padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(0,0,0,.2); background: transparent; cursor: pointer; }',
    '    .value { font-variant-numeric: tabular-nums; font-size: 24px; }',
    '    .box { height: var(--h); width: 100%; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #06b6d4); }',
    '    .muted { opacity: .72; font-size: 12px; }',
    '  `',
    '  document.head.appendChild(style)',
    '}',
    '',
    'function render() {',
    '  let count = 0',
    '  let boxHeight = 240',
    '',
    '  createStyle()',
    '',
    '  app.innerHTML = `',
    '    <div class="wrap">',
    '      <div class="card">',
    `        <h1>${title}</h1>`,
    '        <div class="row">',
    '          <button id="dec" type="button">-1</button>',
    '          <div class="value" id="count">${count}</div>',
    '          <button id="inc" type="button">+1</button>',
    '        </div>',
    '',
    '        <div style="height: 12px"></div>',
    '',
    '        <div class="row">',
    '          <label for="range">渐变块高度</label>',
    '          <input id="range" type="range" min="120" max="520" value="${boxHeight}" />',
    '          <span class="muted" id="rangeValue">${boxHeight}px</span>',
    '        </div>',
    '',
    '        <div style="height: 12px"></div>',
    '        <div class="box" id="box" style="--h: ${boxHeight}px"></div>',
    '        <div style="height: 12px"></div>',
    '        <div class="muted">这个 demo 会向父页面 postMessage 高度用于自适应。</div>',
    '      </div>',
    '    </div>',
    '  `',
    '',
    "  const countEl = document.querySelector('#count')",
    "  const boxEl = document.querySelector('#box')",
    "  const rangeEl = document.querySelector('#range')",
    "  const rangeValueEl = document.querySelector('#rangeValue')",
    '',
    "  document.querySelector('#dec').addEventListener('click', () => {",
    '    count -= 1',
    '    countEl.textContent = String(count)',
    '    postResize()',
    '  })',
    '',
    "  document.querySelector('#inc').addEventListener('click', () => {",
    '    count += 1',
    '    countEl.textContent = String(count)',
    '    postResize()',
    '  })',
    '',
    "  rangeEl.addEventListener('input', () => {",
    '    boxHeight = Number(rangeEl.value)',
    "    boxEl.style.setProperty('--h', `${boxHeight}px`)",
    '    rangeValueEl.textContent = `${boxHeight}px`',
    '    postResize()',
    '  })',
    '',
    '  const ro = new ResizeObserver(() => postResize())',
    '  ro.observe(document.documentElement)',
    '',
    "  window.addEventListener('load', postResize)",
    "  window.addEventListener('resize', postResize)",
    '  postResize()',
    '}',
    '',
    'render()',
    '',
  ].join('\n')
}

function createWorkMetaYml({ title, slug, authorId, port, height }) {
  const date = formatDateISO(new Date())
  return [
    `title: ${title}`,
    `summary: ${slug} 的示例作品。`,
    'type: demo',
    `date: ${date}`,
    'tags:',
    '  - demo',
    `  - ${slug}`,
    'category: Web App',
    'demo:',
    '  kind: iframe',
    `  src: /demos/${authorId}/${slug}/`,
    `  devSrc: http://localhost:${port}/`,
    `  height: ${height}`,
    '',
  ].join('\n')
}

function createWorkIndexMdx({ title, slug }) {
  return [`# ${title}`, '', `这里可以写 ${slug} 的实现思路、交互说明与注意事项。`, ''].join('\n')
}

async function main() {
  const rawSlug = process.argv[2]
  if (!rawSlug || rawSlug.startsWith('-')) {
    throw new Error(
      'Usage: pnpm demo:new <slug> [--author gcy] [--port 5173] [--title <title>] [--height 720] [--force]',
    )
  }

  const authorId = normalizeId(getArg('--author') ?? 'gcy')
  const slug = normalizeId(rawSlug)
  const port = parseIntArg(getArg('--port'), 5173)
  const height = parseIntArg(getArg('--height'), 720)
  const title = String(getArg('--title') ?? `${slug} Demo`).trim()
  const force = hasFlag('--force')

  const demoDir = path.join(repoRoot, 'demos', authorId, slug)
  const workDir = path.join(repoRoot, 'content', 'works', authorId, slug)

  await mkdirp(demoDir)
  const demoEntries = await listDirSafe(demoDir)
  if (!force && demoEntries.length > 0) {
    throw new Error(
      `Demo directory is not empty: ${path.relative(repoRoot, demoDir)} (use --force to overwrite template files)`,
    )
  }

  const demoFiles = [
    {
      filePath: path.join(demoDir, 'package.json'),
      content: createDemoPackageJson({ authorId, slug, port }) + '\n',
    },
    { filePath: path.join(demoDir, 'vite.config.js'), content: createViteConfig() },
    { filePath: path.join(demoDir, 'index.html'), content: createIndexHtml({ title }) },
    { filePath: path.join(demoDir, 'main.js'), content: createMainJs({ title }) },
  ]

  for (const f of demoFiles) {
    await writeFileSafe(f.filePath, f.content, { force })
  }

  await mkdirp(workDir)
  await writeFileSafe(
    path.join(workDir, 'meta.yml'),
    createWorkMetaYml({ title, slug, authorId, port, height }),
    { force },
  )
  await writeFileSafe(path.join(workDir, 'index.mdx'), createWorkIndexMdx({ title, slug }), {
    force,
  })

  const relDemoDir = path.relative(repoRoot, demoDir)
  const relWorkDir = path.relative(repoRoot, workDir)

  console.log(`Initialized demo: ${relDemoDir}`)
  console.log(`Initialized content: ${relWorkDir}`)
  console.log('')
  console.log('Next:')
  console.log(`  pnpm -C ${relDemoDir} dev`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
