import { useState, useEffect } from "react"
import { ShieldCheck, ShieldAlert } from "lucide-react"
import { getAccount, updateAccount, resendVerification } from "../api"

const FREQUENCIES = [
  { value: "Daily", label: "Daily", hint: "Every morning: overdue, today and tomorrow." },
  { value: "Weekly", label: "Selected days", hint: "On the days you pick, covering everything up to your next one." },
  { value: "Fortnightly", label: "Every 15 days", hint: "Covers everything due in the next 15 days." },
  { value: "Monthly", label: "Monthly", hint: "Covers everything due in the next month." },
]

const DAYS = [
  ["Monday", "M"], ["Tuesday", "T"], ["Wednesday", "W"], ["Thursday", "T"],
  ["Friday", "F"], ["Saturday", "S"], ["Sunday", "S"],
]

const sameDays = (a, b) => [...a].sort().join() === [...b].sort().join()

function AccountPage({ token }) {
  const [account, setAccount] = useState(null)
  const [email, setEmail] = useState("")
  const [remindersEnabled, setRemindersEnabled] = useState(false)
  const [frequency, setFrequency] = useState("Daily")
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadAccount()
  }, [])

  function applyAccount(data) {
    setAccount(data)
    setEmail(data.email || "")
    setRemindersEnabled(data.emailRemindersEnabled)
    setFrequency(data.reminderFrequency || "Daily")
    setDays(data.reminderDays || [])
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

  function touch() {
    setSaved(false)
    setNotice("")
  }

  function toggleDay(day) {
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]))
    touch()
  }

  const trimmedEmail = email.trim()
  const hasEmail = trimmedEmail.length > 0
  const emailChanged = trimmedEmail.toLowerCase() !== (account?.email || "")
  const effectiveReminders = hasEmail && remindersEnabled
  const missingDays = effectiveReminders && frequency === "Weekly" && days.length === 0

  const isDirty =
    account &&
    (emailChanged ||
      effectiveReminders !== account.emailRemindersEnabled ||
      frequency !== account.reminderFrequency ||
      !sameDays(days, account.reminderDays || []))

  async function handleSave(e) {
    e.preventDefault()
    setError("")
    setNotice("")
    setSaved(false)
    setSaving(true)
    try {
      const data = await updateAccount(token, {
        email: hasEmail ? trimmedEmail : null,
        emailRemindersEnabled: effectiveReminders,
        reminderFrequency: frequency,
        reminderDays: days,
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
  const activeHint = FREQUENCIES.find((f) => f.value === frequency)?.hint

  const optionStyle = (active) => ({
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.05em",
    color: active ? "var(--color-void)" : "var(--color-cyan)",
    background: active ? "var(--color-cyan)" : "transparent",
    border: "1px solid var(--color-cyan)",
  })

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
            style={{ color: "#ffb020", borderColor: "rgba(255,176,32,0.4)", background: "rgba(255,176,32,0.1)" }}
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
                <div className="hud-title text-lg" style={{ overflowWrap: "anywhere" }}>
                  {account.username}
                </div>
              </div>
              <span
                className="hud-label shrink-0"
                style={{ color: isAdmin ? "var(--color-amber)" : "var(--color-cyan-dim)" }}
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
                  touch()
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
                    style={{ color: account.emailConfirmed ? "var(--color-green)" : "var(--color-amber)" }}
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
                      style={{ color: "var(--color-cyan)" }}
                    >
                      {resending ? "Sending..." : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}
              {emailChanged && hasEmail && (
                <div className="hud-label mt-2">A changed address will need to be verified again.</div>
              )}
              {notice && (
                <div className="hud-label mt-2" style={{ color: "var(--color-green)", textTransform: "none" }} role="status">
                  {notice}
                </div>
              )}
            </div>

            {/* Reminders toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="hud-label" style={{ color: "var(--color-text-glow)" }}>
                  Task reminders
                </div>
                <div className="hud-label mt-1">
                  {hasEmail
                    ? "A briefing of overdue and upcoming tasks, sent to a verified address."
                    : "Add an email to enable reminders."}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={effectiveReminders}
                aria-label="Task reminders"
                disabled={!hasEmail}
                onClick={() => {
                  setRemindersEnabled((v) => !v)
                  touch()
                }}
                className="relative shrink-0 w-12 h-6 transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  border: `1px solid ${effectiveReminders ? "var(--color-green)" : "var(--color-cyan-dim)"}`,
                  background: effectiveReminders
                    ? "color-mix(in srgb, var(--color-green) 20%, transparent)"
                    : "transparent",
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 transition-all"
                  style={{
                    left: effectiveReminders ? "calc(100% - 1.25rem)" : "0.25rem",
                    background: effectiveReminders ? "var(--color-green)" : "var(--color-cyan-dim)",
                    boxShadow: effectiveReminders ? "0 0 8px var(--color-green)" : "none",
                  }}
                />
              </button>
            </div>

            {/* Schedule */}
            {effectiveReminders && (
              <fieldset className="flex flex-col gap-3">
                <legend className="hud-label mb-2">How often</legend>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Reminder frequency">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      role="radio"
                      aria-checked={frequency === f.value}
                      onClick={() => {
                        setFrequency(f.value)
                        touch()
                      }}
                      className="py-2 px-2 text-sm transition"
                      style={optionStyle(frequency === f.value)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {frequency === "Weekly" && (
                  <div className="flex gap-2 flex-wrap" role="group" aria-label="Reminder days">
                    {DAYS.map(([day, short]) => {
                      const active = days.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={active}
                          aria-label={day}
                          title={day}
                          onClick={() => toggleDay(day)}
                          className="w-9 h-9 text-sm transition"
                          style={optionStyle(active)}
                        >
                          {short}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="hud-label" style={{ textTransform: "none", color: missingDays ? "var(--color-amber)" : undefined }}>
                  {missingDays ? "Choose at least one day." : activeHint}
                </div>
              </fieldset>
            )}

            <div className="flex items-center justify-end gap-3">
              {saved && !isDirty && (
                <span className="hud-label" style={{ color: "var(--color-green)" }} role="status">
                  Saved
                </span>
              )}
              <button type="submit" disabled={!isDirty || saving || missingDays} className="hud-btn px-5 py-2">
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