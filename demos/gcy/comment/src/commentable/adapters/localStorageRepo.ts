// 引入评论实体与仓库接口类型，用于声明 localStorage 实现的返回类型与数据结构。
import type { CommentEntity, CommentRepository } from './repositoryTypes'

// 创建一个基于 localStorage 的 CommentRepository，实现 demo 的最小持久化闭环。
export function createLocalStorageRepo(storageKey = 'commentable:comments'): CommentRepository {
  // 返回符合 CommentRepository 约定的对象，包含 fetch/save/delete 三个方法。
  return {
    // 根据 docId 拉取对应文档的全部评论。
    async fetchByDocId(docId) {
      // 读取 storageKey 下的全部评论列表。
      const all = readAll(storageKey)
      // 过滤出属于当前 docId 的评论。
      return all.filter((c) => c.docId === docId)
    },
    // 保存（创建或更新）一条评论。
    async save(comment) {
      // 读取当前全部评论列表。
      const all = readAll(storageKey)
      // 若 comment.id 不存在则生成一个新 id；否则用于更新已有记录。
      const id = comment.id ?? crypto.randomUUID()
      // 组装成完整的 CommentEntity（确保有 id 字段）。
      const saved: CommentEntity = { ...comment, id }
      // 将最新记录放在最前，并移除旧的同 id 记录，保证幂等更新。
      const next = [saved, ...all.filter((c) => c.id !== id)]
      // 写回 localStorage。
      writeAll(storageKey, next)
      // 返回保存后的实体（上层可用于更新 UI）。
      return saved
    },
    // 删除指定 id 的评论。
    async delete(id) {
      // 读取当前全部评论列表。
      const all = readAll(storageKey)
      // 过滤掉要删除的评论并写回。
      writeAll(
        storageKey,
        all.filter((c) => c.id !== id),
      )
    },
  }
}

// 从 localStorage 读取并解析所有评论数据；若不存在或解析失败则返回空数组。
function readAll(storageKey: string): CommentEntity[] {
  // 读取原始字符串。
  const raw = localStorage.getItem(storageKey)
  // 没有数据时返回空数组。
  if (!raw) return []
  // JSON.parse 可能得到任意类型，这里先当 unknown 处理。
  const parsed = JSON.parse(raw) as unknown
  // 只接受数组类型，否则返回空数组，避免运行时报错。
  return Array.isArray(parsed) ? (parsed as CommentEntity[]) : []
}

// 将评论数组序列化后写回 localStorage。
function writeAll(storageKey: string, all: CommentEntity[]) {
  // 以 JSON 字符串形式持久化。
  localStorage.setItem(storageKey, JSON.stringify(all))
}
