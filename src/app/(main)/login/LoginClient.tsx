'use client'

import { useMemo, useState } from 'react'
import { BackButton } from '@/components/BackButton'
import styles from './LoginClient.module.scss'

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-3.162 19.486c.5.092.683-.217.683-.483 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.342-3.369-1.342-.455-1.156-1.11-1.465-1.11-1.465-.907-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.53 2.341 1.088 2.91.832.092-.647.349-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.092.39-1.985 1.029-2.684-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.58 9.58 0 0112 6.844a9.58 9.58 0 012.504.337c1.909-1.295 2.748-1.026 2.748-1.026.546 1.378.203 2.397.1 2.65.64.699 1.028 1.592 1.028 2.684 0 3.842-2.338 4.687-4.566 4.936.359.31.679.923.679 1.86 0 1.343-.012 2.425-.012 2.756 0 .268.18.58.688.481A10 10 0 0012 2z" />
    </svg>
  )
}

function LayoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
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
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPassword2, setSignupPassword2] = useState('')

  const notices = useMemo(() => {
    return { error: initialError, success: initialSuccess }
  }, [initialError, initialSuccess])

  return (
    <div className={styles.container}>
      <div className={styles.back}>
        <BackButton href="/" label="Back to Home" />
      </div>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <LayoutIcon />
          </div>
          <h2 className={styles.title}>Welcome to DevForge</h2>
          <p className={styles.subtitle}>Join the community of creative builders.</p>
        </div>

        {notices.error ? (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <span>{notices.error}</span>
          </div>
        ) : null}

        {notices.success ? (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <span>{notices.success}</span>
          </div>
        ) : null}

        <form action="/auth/github" method="post">
          <button type="submit" className={styles.githubBtn}>
            <GitHubIcon />
            Continue with GitHub
          </button>
        </form>

        <div className={styles.divider}>
          <span>Or continue with email</span>
        </div>

        {activeTab === 'login' ? (
          <form action="/auth/password/login" method="post" className={styles.form}>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              Sign In
            </button>
          </form>
        ) : (
          <form
            action="/auth/password/signup"
            method="post"
            onSubmit={(e) => {
              if (!signupPassword || signupPassword.length < 8) {
                e.preventDefault()
                alert('Password must be at least 8 characters.')
                return
              }
              if (signupPassword !== signupPassword2) {
                e.preventDefault()
                alert('Passwords do not match.')
              }
            }}
            className={styles.form}
          >
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                required
                value={signupPassword2}
                onChange={(e) => setSignupPassword2(e.target.value)}
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              Create Account
            </button>
          </form>
        )}

        <div className={styles.footer}>
          {activeTab === 'login' ? (
            <p>
              Don't have an account yet?
              <button type="button" onClick={() => setActiveTab('signup')}>
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?
              <button type="button" onClick={() => setActiveTab('login')}>
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
