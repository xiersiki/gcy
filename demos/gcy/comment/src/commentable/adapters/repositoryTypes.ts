// CommentableDocId 用于标识一份“可评论文档/页面”的唯一 id（由业务方决定如何生成）。
export type CommentableDocId = string

// CommentAnchor 描述“评论锚点”的最小结构；后续会扩展为 path/offset/quote 等信息。
export interface CommentAnchor {
  // id 是锚点唯一标识，用于关联评论线程与高亮渲染。
  id: string
}

// CommentEntity 表示一条具体的评论记录。
export interface CommentEntity {
  // id 是评论唯一标识（持久化后由存储层返回或生成）。
  id: string
  // docId 标识评论所属的文档/页面。
  docId: CommentableDocId
  // anchorId 关联到被评论的锚点（Anchor）。
  anchorId: string
  // content 是评论正文（纯文本或未来可扩展为富文本结构）。
  content: string
  // createdAt 是创建时间戳（毫秒），用于排序与展示。
  createdAt: number
}

// CommentRepository 抽象了数据读写接口，让组件不绑定具体后端实现。
export interface CommentRepository {
  // fetchByDocId 根据 docId 拉取所有评论（通常包含对应锚点信息或可通过 anchorId 关联）。
  fetchByDocId: (docId: CommentableDocId) => Promise<CommentEntity[]>
  // save 保存一条评论；允许调用方传入可选 id（用于更新/幂等写入）。
  save: (comment: Omit<CommentEntity, 'id'> & { id?: string }) => Promise<CommentEntity>
  // delete 删除一条评论。
  delete: (id: string) => Promise<void>
}
