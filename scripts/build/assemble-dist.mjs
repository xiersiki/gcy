// 从 Node.js 标准库导入 path，用于拼接与解析文件路径。
import path from 'node:path'
// 从 Node.js 标准库导入 fileURLToPath，用于把 import.meta.url 转成文件系统路径。
import { fileURLToPath } from 'node:url'
// 从 Node.js 标准库导入 fs.promises，用于以 Promise 方式进行文件读写。
import { promises as fs } from 'node:fs'

// 把当前模块的 URL 转为真实文件路径（等价于 CJS 里的 __filename）。
const __filename = fileURLToPath(import.meta.url)
// 取当前脚本所在目录（等价于 CJS 里的 __dirname）。
const __dirname = path.dirname(__filename)
// 计算仓库根目录：scripts/build/ 的上两级就是 repo root。
const repoRoot = path.resolve(__dirname, '..', '..')

// outDir 是 Next.js 静态导出产物目录（NEXT_OUTPUT=export 时输出到 out/）。
const outDir = path.join(repoRoot, 'out')
// distDir 是最终发布目录（assemble-dist 会把 out/ 和 demos/**/dist 组装到 dist/）。
const distDir = path.join(repoRoot, 'dist')
// demosRoot 指向所有 demo 的源目录（每个作品 demo 独立构建出 dist）。
const demosRoot = path.join(repoRoot, 'demos')

// 判断某个路径是否存在（文件或目录都算）。
async function pathExists(p) {
  // fs.access 能在路径存在且可访问时成功，否则抛错。
  try {
    // 尝试访问该路径。
    await fs.access(p)
    // 没抛错说明存在。
    return true
  } catch {
    // 访问失败说明不存在（或不可访问），这里按“不存在”处理。
    return false
  }
}

// 递归删除目录或文件（等价于 rm -rf），并且忽略不存在等错误。
async function rmrf(p) {
  // fs.rm 在 node 14+ 支持 recursive/force，catch 兜底避免流程中断。
  await fs.rm(p, { recursive: true, force: true }).catch(() => {})
}

// 递归创建目录（等价于 mkdir -p）。
async function mkdirp(p) {
  // recursive: true 表示父级不存在会一并创建。
  await fs.mkdir(p, { recursive: true })
}

// 递归复制目录内容：把 src 下的文件与子目录完整复制到 dest。
async function copyDir(src, dest) {
  // 读取目录下的所有条目（Dirent），以便区分文件/目录。
  const entries = await fs.readdir(src, { withFileTypes: true })
  // 先确保目标目录存在。
  await mkdirp(dest)
  // 遍历每一个条目并按类型处理。
  for (const e of entries) {
    // 计算源路径。
    const from = path.join(src, e.name)
    // 计算目标路径。
    const to = path.join(dest, e.name)
    // 如果是目录，则递归复制目录。
    if (e.isDirectory()) {
      await copyDir(from, to)
      // 如果是普通文件，则直接 copyFile。
    } else if (e.isFile()) {
      await fs.copyFile(from, to)
    }
  }
}

// 组装站点静态导出：把 out/ 复制到 dist/。
async function assembleSite() {
  // out/ 不存在说明没有跑 export 构建，直接报错提示使用正确脚本。
  if (!(await pathExists(outDir))) {
    throw new Error('Next.js static export not found: out/. Set NEXT_OUTPUT=export before build.')
  }
  // 清空 dist/，保证组装产物干净。
  await rmrf(distDir)
  // 将 out/ 全量复制到 dist/。
  await copyDir(outDir, distDir)
}

// 组装 demos：把 demos/**/dist 复制到 dist/demos/**。
async function assembleDemos() {
  // demos 目录不存在则无需处理。
  if (!(await pathExists(demosRoot))) return
  // 读取 demos 下的一级目录（authorId），读取失败则按空数组处理。
  const authors = await fs.readdir(demosRoot, { withFileTypes: true }).catch(() => [])
  // 遍历每个 author 目录。
  for (const a of authors) {
    // 只处理目录类型条目。
    if (!a.isDirectory()) continue
    // authorId 取目录名。
    const authorId = a.name
    // 读取该作者目录下的 works（slug）。
    const works = await fs
      .readdir(path.join(demosRoot, authorId), { withFileTypes: true })
      .catch(() => [])
    // 遍历每个 work 目录。
    for (const w of works) {
      // 只处理目录类型条目。
      if (!w.isDirectory()) continue
      // slug 取目录名。
      const slug = w.name
      // demoDist 指向该 demo 的构建产物目录（Vite 默认产物目录是 dist）。
      const demoDist = path.join(demosRoot, authorId, slug, 'dist')
      // 如果没有 dist（说明没构建或不需要同步），则跳过。
      if (!(await pathExists(demoDist))) continue
      // target 指向 dist/demos 下的目标目录（保持 authorId/slug 层级）。
      const target = path.join(distDir, 'demos', authorId, slug)
      // 把 demoDist 复制到 dist/demos/** 下。
      await copyDir(demoDist, target)
    }
  }
}

// 主流程：先组装站点，再组装 demos，最后做一次关键产物校验。
async function main() {
  // 把 out/ 复制到 dist/。
  await assembleSite()
  // 把 demos/**/dist 复制到 dist/demos/**。
  await assembleDemos()
  // 校验 dist/index.html 是否存在，确保站点入口已经被正确组装。
  const indexExists = await pathExists(path.join(distDir, 'index.html'))
  // 若入口不存在则直接报错，避免产物不完整还继续发布。
  if (!indexExists) {
    throw new Error('dist/index.html missing after assembly')
  }
}

// 执行主流程；若抛错则打印错误并设置退出码为 1（让 CI 正确失败）。
main().catch((err) => {
  // 输出错误到 stderr，便于 CI 查看日志。
  console.error(err)
  // 设置退出码为 1，表示执行失败。
  process.exitCode = 1
})
