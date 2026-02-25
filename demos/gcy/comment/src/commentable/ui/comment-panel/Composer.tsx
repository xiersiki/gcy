// 该组件用于输入与提交评论内容（未来可接入校验与快捷键）。
import { FormEvent, KeyboardEvent, useState } from 'react'
import type { ComposerProps } from './types'
import { Button } from '@arco-design/web-react'
import Textarea from '@arco-design/web-react/es/Input/textarea'
import styles from './comment-panel.module.css'

export default function Composer({ onSubmit }: ComposerProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text) return
    onSubmit(text)
    setValue('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      submit()
    }
  }

  const canSubmit = value.trim().length > 0

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <Textarea
        value={value}
        onChange={(nextValue) => setValue(nextValue)}
        onKeyDown={handleKeyDown}
        rows={4}
        placeholder="写下你的评论（Ctrl/Cmd + Enter 快捷提交）"
        maxLength={500}
      />
      <div className={styles.composerActions}>
        <span className={styles.counter}>{value.trim().length}/500</span>
        <Button type="primary" htmlType="submit" disabled={!canSubmit}>
          提交
        </Button>
      </div>
    </form>
  )
}
