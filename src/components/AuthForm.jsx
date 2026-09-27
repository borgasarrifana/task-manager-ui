import { useState } from "react"
import { login, register } from "../api"
import HudFrame from "./HudFrame.jsx"

function AuthForm({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isRegister) {
        await register(username, email.trim(), password)
      }
      const data = await login(username, password)
      onLoginSuccess(data.token, data.refreshToken, username, data.role)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setIsRegister((r) => !r)
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <HudFrame
        size="lg"
        className="max-w-sm w-full"
        bodyClassName="p-6"
        style={{ zIndex: 10 }}
      >
        <div className="flex items-center justify-center mb-2">
          <span className="hud-status-dot mr-2"></span>
          <span className="hud-label">System {isRegister ? "Enrollment" : "Access"}</span>
        </div>

        <h1 className="hud-title text-2xl text-center mb-8">
          {isRegister ? "New User" : "Sign In"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="auth-username" className="hud-label block mb-1">Username</label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="hud-input w-full px-3 py-2"
              autoComplete="username"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label htmlFor="auth-email" className="hud-label block mb-1">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hud-input w-full px-3 py-2"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-password" className="hud-label block mb-1">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="hud-input w-full px-3 py-2"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : undefined}
              required
            />
          </div>

          {error && (
            <p
              className="hud-label border px-3 py-2"
              style={{ color: '#ffb020', borderColor: 'rgba(255,176,32,0.4)', background: 'rgba(255,176,32,0.1)' }}
            >
              ⚠ {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="hud-btn py-3 mt-2">
            {loading ? "Authenticating..." : isRegister ? "Register" : "Initiate Login"}
          </button>
        </form>

        <p className="hud-label text-center mt-6">
          {isRegister ? "Already registered?" : "No account?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="underline"
            style={{ color: 'var(--color-cyan)' }}
          >
            {isRegister ? "Sign in" : "Register"}
          </button>
        </p>
      </HudFrame>
    </div>
  )
}

export default AuthForm