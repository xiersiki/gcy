'use client'

import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  Space,
  Tabs,
  Typography,
} from '@arco-design/web-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-3.162 19.486c.5.092.683-.217.683-.483 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.342-3.369-1.342-.455-1.156-1.11-1.465-1.11-1.465-.907-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.53 2.341 1.088 2.91.832.092-.647.349-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.092.39-1.985 1.029-2.684-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.58 9.58 0 0112 6.844a9.58 9.58 0 012.504.337c1.909-1.295 2.748-1.026 2.748-1.026.546 1.378.203 2.397.1 2.65.64.699 1.028 1.592 1.028 2.684 0 3.842-2.338 4.687-4.566 4.936.359.31.679.923.679 1.86 0 1.343-.012 2.425-.012 2.756 0 .268.18.58.688.481A10 10 0 0012 2z" />
    </svg>
  )
}

export function LoginClient({
  initialError,
  initialSuccess,
}: {
  initialError: string
  initialSuccess: string
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [dismissed, setDismissed] = useState(false)
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPassword2, setSignupPassword2] = useState('')

  const notices = useMemo(() => {
    if (dismissed) return { error: '', success: '' }
    return { error: initialError, success: initialSuccess }
  }, [dismissed, initialError, initialSuccess])

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 4rem)',
        display: 'grid',
        placeItems: 'center',
        padding: '24px 12px',
        marginTop: '-1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: -54 }}>
          <Button
            type="secondary"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) router.back()
              else router.push('/')
            }}
            icon={<BackIcon />}
          >
            返回
          </Button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Typography.Title heading={3} style={{ margin: 0 }}>
            登录
          </Typography.Title>
          <Typography.Text type="secondary">登录后才能发布点子与认领点子。</Typography.Text>
        </div>

        {notices.error ? (
          <div style={{ marginBottom: 12 }}>
            <Alert
              type="error"
              closable
              onClose={() => setDismissed(true)}
              content={notices.error}
              showIcon
            />
          </div>
        ) : null}
        {notices.success ? (
          <div style={{ marginBottom: 12 }}>
            <Alert
              type="success"
              closable
              onClose={() => setDismissed(true)}
              content={notices.success}
              showIcon
            />
          </div>
        ) : null}

        <Card
          bordered
          style={{
            borderRadius: 16,
            boxShadow: '0 8px 30px rgba(17,24,39,.08)',
          }}
        >
          <Tabs
            type="rounded"
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as 'login' | 'signup')}
          >
            <Tabs.TabPane key="login" title="邮箱登录">
              <form action="/auth/password/login" method="post">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Input
                    name="email"
                    type="email"
                    placeholder="邮箱"
                    autoComplete="email"
                    allowClear
                    size="large"
                    required
                  />
                  <Input.Password
                    name="password"
                    placeholder="密码"
                    autoComplete="current-password"
                    size="large"
                    required
                  />
                  <Button type="primary" long htmlType="submit" size="large">
                    登录
                  </Button>
                </Space>
              </form>
            </Tabs.TabPane>

            <Tabs.TabPane key="signup" title="邮箱注册">
              <form
                action="/auth/password/signup"
                method="post"
                onSubmit={(e) => {
                  if (!signupPassword || signupPassword.length < 8) {
                    e.preventDefault()
                    return
                  }
                  if (signupPassword !== signupPassword2) {
                    e.preventDefault()
                  }
                }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Input
                    name="email"
                    type="email"
                    placeholder="邮箱"
                    autoComplete="email"
                    allowClear
                    size="large"
                    required
                  />
                  <Input.Password
                    name="password"
                    placeholder="密码（至少 8 位）"
                    autoComplete="new-password"
                    size="large"
                    required
                    value={signupPassword}
                    onChange={(v) => setSignupPassword(v)}
                  />
                  <Input.Password
                    placeholder="确认密码"
                    autoComplete="new-password"
                    size="large"
                    required
                    value={signupPassword2}
                    onChange={(v) => setSignupPassword2(v)}
                    status={
                      signupPassword2 && signupPassword !== signupPassword2 ? 'error' : undefined
                    }
                  />
                  {signupPassword && signupPassword.length > 0 && signupPassword.length < 8 ? (
                    <Typography.Text type="error">密码至少 8 位</Typography.Text>
                  ) : null}
                  {signupPassword2 && signupPassword !== signupPassword2 ? (
                    <Typography.Text type="error">两次输入的密码不一致</Typography.Text>
                  ) : null}
                  <Button type="primary" long htmlType="submit" size="large">
                    注册
                  </Button>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    注册后可能需要到邮箱完成验证，再返回登录。
                  </Typography.Text>
                </Space>
              </form>
            </Tabs.TabPane>
          </Tabs>

          <Divider style={{ margin: '16px 0' }}>或</Divider>

          <form action="/auth/github" method="post">
            <Button long htmlType="submit" size="large">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <GitHubIcon />
                使用 GitHub 登录
              </span>
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
