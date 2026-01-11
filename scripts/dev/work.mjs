import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { emitKeypressEvents } from 'node:readline'
import { fileURLToPath } from 'node:url'

import YAML from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const worksRoot = path.join(repoRoot, 'content', 'works')

function run(cmd, args, opts) {
  const child = spawn(cmd, args, { stdio: 'inherit', ...opts })
  child.on('exit', (code, signal) => {
    if (signal) return
    if (code && code !== 0) process.exitCode = code
  })
  return child
}

async function readWorkMeta(authorId, slug) {
  const metaPath = path.join(worksRoot, authorId, slug, 'meta.yml')
  const raw = await fs.readFile(metaPath, 'utf-8').catch(() => null)
  if (!raw) return null
  const doc = YAML.parse(raw)
  return doc && typeof doc === 'object' ? doc : null
}

async function listDemoWorks() {
  const authors = await fs.readdir(worksRoot, { withFileTypes: true }).catch(() => [])
  const items = []

  for (const authorDir of authors) {
    if (!authorDir.isDirectory()) continue
    const authorId = authorDir.name
    const slugs = await fs
      .readdir(path.join(worksRoot, authorId), { withFileTypes: true })
      .catch(() => [])

    for (const slugDir of slugs) {
      if (!slugDir.isDirectory()) continue
      const slug = slugDir.name
      const meta = await readWorkMeta(authorId, slug)
      if (!meta?.demo || meta.demo.kind !== 'iframe') continue
      const id = `${authorId}/${slug}`
      const demoDir = path.join(repoRoot, 'demos', authorId, slug)
      const hasDemo = existsSync(demoDir)
      items.push({
        id,
        slug,
        title: typeof meta.title === 'string' ? meta.title : id,
        hasDemo,
      })
    }
  }

  items.sort((a, b) => a.id.localeCompare(b.id))
  return items
}

function groupByAuthor(items) {
  const byAuthor = new Map()
  for (const it of items) {
    const [authorId] = it.id.split('/')
    const current = byAuthor.get(authorId) ?? []
    current.push(it)
    byAuthor.set(authorId, current)
  }

  return Array.from(byAuthor.entries())
    .map(([authorId, works]) => {
      works.sort((a, b) => a.id.localeCompare(b.id))
      return { authorId, works }
    })
    .sort((a, b) => a.authorId.localeCompare(b.authorId))
}

function renderMenu({ title, subtitle, items, selectedIndex, message }) {
  const lines = []
  lines.push(title)
  if (subtitle) lines.push(subtitle)
  lines.push('')

  for (let i = 0; i < items.length; i += 1) {
    const prefix = i === selectedIndex ? '❯' : ' '
    lines.push(`${prefix} ${items[i]}`)
  }

  lines.push('')
  if (message) lines.push(message)
  lines.push('↑/↓ 选择，Enter 确认，Esc 返回，Ctrl+C 退出')

  process.stdout.write('\x1b[2J\x1b[H')
  process.stdout.write(`${lines.join('\n')}\n`)
}

async function promptSelect(items) {
  if (!process.stdin.isTTY) return null

  const authors = groupByAuthor(items)
  emitKeypressEvents(process.stdin)
  const originalRawMode = process.stdin.isRaw
  process.stdin.setRawMode(true)
  process.stdin.resume()

  let stage = 'author'
  let selectedAuthorIndex = 0
  let selectedWorkIndex = 0
  let message = ''
  let onKeypress = null

  function getAuthorMenuItems() {
    const rows = ['仅启动主站']
    for (const author of authors) rows.push(author.authorId)
    return rows
  }

  function getWorkMenuItems(author) {
    const rows = ['返回选择作者']
    for (const w of author.works) {
      const suffix = w.hasDemo ? '' : ' (缺少 demos/<author>/<slug>)'
      rows.push(`${w.id} · ${w.title}${suffix}`)
    }
    return rows
  }

  function clampIndex(index, length) {
    if (length <= 0) return 0
    const mod = index % length
    return mod < 0 ? mod + length : mod
  }

  function cleanup() {
    if (onKeypress) process.stdin.off('keypress', onKeypress)
    process.stdin.setRawMode(Boolean(originalRawMode))
    process.stdin.pause()
  }

  function redraw() {
    if (stage === 'author') {
      renderMenu({
        title: '选择作者：',
        subtitle: '（选择后进入作品列表）',
        items: getAuthorMenuItems(),
        selectedIndex: selectedAuthorIndex,
        message,
      })
      return
    }

    const author = authors[selectedAuthorIndex - 1]
    renderMenu({
      title: `选择作品：${author.authorId}`,
      subtitle: '',
      items: getWorkMenuItems(author),
      selectedIndex: selectedWorkIndex,
      message,
    })
  }

  function selectMainSite(resolve) {
    cleanup()
    resolve(null)
  }

  function selectWork(author, index, resolve) {
    const work = author.works[index]
    if (!work) return
    if (!work.hasDemo) {
      message = `无法联调：缺少 demos/${author.authorId}/${work.slug} 目录`
      redraw()
      return
    }
    cleanup()
    resolve(work.id)
  }

  return new Promise((resolve) => {
    onKeypress = (str, key) => {
      if (!key) return

      if (key.ctrl && key.name === 'c') {
        cleanup()
        process.exit(130)
      }

      if (key.name === 'escape') {
        if (stage === 'work') {
          stage = 'author'
          selectedWorkIndex = 0
          message = ''
          redraw()
          return
        }
        selectMainSite(resolve)
        return
      }

      if (key.name === 'up') {
        message = ''
        if (stage === 'author') {
          selectedAuthorIndex = clampIndex(selectedAuthorIndex - 1, getAuthorMenuItems().length)
        } else {
          const author = authors[selectedAuthorIndex - 1]
          if (!author) return
          selectedWorkIndex = clampIndex(selectedWorkIndex - 1, getWorkMenuItems(author).length)
        }
        redraw()
        return
      }

      if (key.name === 'down') {
        message = ''
        if (stage === 'author') {
          selectedAuthorIndex = clampIndex(selectedAuthorIndex + 1, getAuthorMenuItems().length)
        } else {
          const author = authors[selectedAuthorIndex - 1]
          if (!author) return
          selectedWorkIndex = clampIndex(selectedWorkIndex + 1, getWorkMenuItems(author).length)
        }
        redraw()
        return
      }

      if (key.name === 'return' || key.name === 'enter') {
        message = ''

        if (stage === 'author') {
          if (selectedAuthorIndex === 0) {
            selectMainSite(resolve)
            return
          }

          const author = authors[selectedAuthorIndex - 1]
          if (!author || author.works.length === 0) {
            message = '该作者没有可联调的作品'
            redraw()
            return
          }

          stage = 'work'
          selectedWorkIndex = clampIndex(1, getWorkMenuItems(author).length)
          redraw()
          return
        }

        const author = authors[selectedAuthorIndex - 1]
        if (!author) {
          stage = 'author'
          selectedAuthorIndex = 0
          redraw()
          return
        }

        if (selectedWorkIndex === 0) {
          stage = 'author'
          selectedWorkIndex = 0
          message = ''
          redraw()
          return
        }

        selectWork(author, selectedWorkIndex - 1, resolve)
      }
    }

    process.stdin.on('keypress', onKeypress)
    process.on('exit', cleanup)
    process.on('SIGTERM', () => {
      cleanup()
      process.exit(143)
    })

    selectedAuthorIndex = clampIndex(selectedAuthorIndex, getAuthorMenuItems().length)
    redraw()
  })
}

function parseWorkId(argv) {
  return argv.find((arg) => arg && arg.includes('/')) ?? null
}

async function main() {
  const argv = process.argv.slice(2)
  const workIdFromArgs = parseWorkId(argv)

  let selected = workIdFromArgs
  if (!selected) {
    if (!process.stdin.isTTY) {
      console.error('Usage: pnpm dev:work -- <authorId>/<slug>')
      process.exitCode = 1
      return
    }
    const items = await listDemoWorks()
    selected = await promptSelect(items)
  }

  const mainSite = run('pnpm', ['dev'], { cwd: repoRoot, env: process.env })
  let demo = null

  if (selected) {
    const [authorId, slug] = selected.split('/')
    const demoDir = path.join(repoRoot, 'demos', authorId, slug)
    if (!existsSync(demoDir)) {
      console.error(`Demo directory not found: demos/${authorId}/${slug}`)
      mainSite.kill('SIGINT')
      process.exitCode = 1
      return
    }
    demo = run('pnpm', ['dev'], { cwd: demoDir, env: process.env })
  }

  function shutdown() {
    demo?.kill('SIGINT')
    mainSite.kill('SIGINT')
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
