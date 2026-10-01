import { useState, useEffect } from "react"
import { ShieldCheck, ShieldAlert } from "lucide-react"
import { getAccount, updateAccount } from "../api"
import { getAccount, updateAccount, resendVerification } from "../api"

function AccountPage({ token }) {
  const [account, setAccount] = useState(null)
  const [email, setEmail] = useState("")
  const [remindersEnabled, setRemindersEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState("")
  const [resending, setResending] = useState(false)

  useEffect(() => {
    loadAccount()
  }, [])

  function applyAccount(data) {
    setAccount(data)
    setEmail(data.email || "")
    setRemindersEnabled(data.emailRemindersEnabled)
  }

  async function loadAccount() {
    try {
      setLoading(true)
      applyAccount(await getAccount(token))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const trimmedEmail = email.trim()
  const hasEmail = trimmedEmail.length > 0
  const emailChanged = trimmedEmail.toLowerCase() !== (account?.email || "")
  const effectiveReminders = hasEmail && remindersEnabled
  const isDirty = account && (emailChanged || effectiveReminders !== account.emailRemindersEnabled)

  async function handleSave(e) {
    e.preventDefault()
    setError("")
    setSaved(false)
    setSaving(true)
    try {
      const data = await updateAccount(token, {
        email: hasEmail ? trimmedEmail : null,
        emailRemindersEnabled: effectiveReminders,
      })
      applyAccount(data)
      setSaved(true)
      setNotice(emailChanged && data.email ? `Verification email sent to ${data.email}.` : "")
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

    async function handleResend() {
    setError("")
    setNotice("")
    setResending(true)
    try {
      await resendVerification(token)
      setNotice(`Verification email sent to ${account.email}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  const isAdmin = account?.role === "Admin"

  return (
    <div className="min-h-screen relative p-4 md:p-8">
      <div className="max-w-xl mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="hud-status-dot"></span>
          <span className="hud-label">Operator Profile</span>
        </div>
        <h1 className="hud-title text-2xl md:text-3xl mb-6">Account</h1>

        {error && (
          <p
            className="hud-label px-3 py-2 mb-4 border"
            style={{ color: '#ffb020', borderColor: 'rgba(255,176,32,0.4)', background: 'rgba(255,176,32,0.1)' }}
          >
            ⚠ {error}
          </p>
        )}

        {loading && !account ? (
          <p className="hud-label">Scanning...</p>
        ) : account && (
          <form onSubmit={handleSave} className="hud-panel p-5 md:p-6 flex flex-col gap-6">
            {/* Identity */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="hud-label mb-1">Operator</div>
                <div className="hud-title text-lg" style={{ overflowWrap: 'anywhere' }}>
                  {account.username}
                </div>
              </div>
              <span
                className="hud-label shrink-0"
                style={{ color: isAdmin ? 'var(--color-amber)' : 'var(--color-cyan-dim)' }}
              >
                {account.role}
              </span>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="account-email" className="hud-label block mb-1">Email</label>
              <input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSaved(false)
                }}
                className="hud-input w-full px-3 py-2"
                autoComplete="email"
                maxLength={254}
                placeholder="NOT SET"
              />

                            {account.email && !emailChanged && (
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span
                    className="hud-label flex items-center gap-1.5"
                    style={{ color: account.emailConfirmed ? 'var(--color-green)' : 'var(--color-amber)' }}
                  >
                    {account.emailConfirmed ? (
                      <><ShieldCheck size={14} aria-hidden="true" /> Verified</>
                    ) : (
                      <><ShieldAlert size={14} aria-hidden="true" /> Not verified yet</>
                    )}
                  </span>
                  {!account.emailConfirmed && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="hud-label underline"
                      style={{ color: 'var(--color-cyan)' }}
                    >
                      {resending ? "Sending..." : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}
              {notice && (
                <div className="hud-label mt-2" style={{ color: 'var(--color-green)', textTransform: 'none' }} role="status">
                  {notice}
                </div>
              )}
            </div>

            {/* Reminders toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="hud-label" style={{ color: 'var(--color-text-glow)' }}>
                  Daily task reminders
                </div>
                <div className="hud-label mt-1">
                  {hasEmail
                    ? "Overdue and upcoming tasks, once a day, to a verified address."
                    : "Add an email to enable reminders."}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={effectiveReminders}
                aria-label="Daily task reminders"
                disabled={!hasEmail}
                onClick={() => {
                  setRemindersEnabled((v) => !v)
                  setSaved(false)
                }}
                className="relative shrink-0 w-12 h-6 transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  border: `1px solid ${effectiveReminders ? 'var(--color-green)' : 'var(--color-cyan-dim)'}`,
                  background: effectiveReminders
                    ? 'color-mix(in srgb, var(--color-green) 20%, transparent)'
                    : 'transparent',
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 transition-all"
                  style={{
                    left: effectiveReminders ? 'calc(100% - 1.25rem)' : '0.25rem',
                    background: effectiveReminders ? 'var(--color-green)' : 'var(--color-cyan-dim)',
                    boxShadow: effectiveReminders ? '0 0 8px var(--color-green)' : 'none',
                  }}
                />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3">
              {saved && !isDirty && (
                <span className="hud-label" style={{ color: 'var(--color-green)' }} role="status">
                  Saved
                </span>
              )}
              <button type="submit" disabled={!isDirty || saving} className="hud-btn px-5 py-2">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AccountPage