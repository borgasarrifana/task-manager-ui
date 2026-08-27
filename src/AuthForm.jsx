import { useState } from "react"
import { login, register } from "./api"

function AuthForm({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
      e.preventDefault()
      setError("")
      setLoading(true)

      try {
        if (isRegister) {
          await register(username, password)
          const data = await login(username, password)
          onLoginSuccess(data.token, data.refreshToken, username, data.role)
        } else {
          const data = await login(username, password)
          onLoginSuccess(data.token, data.refreshToken, username, data.role)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="hud-panel p-8 w-full max-w-sm relative">
        <div className="reactor-ring reactor-ring-outer" style={{ inset: '-24px', width: '48px', height: '48px', margin: '0 auto', position: 'relative', display: 'none' }}></div>

        <div className="flex items-center justify-center mb-2">
          <span className="hud-status-dot mr-2"></span>
          <span className="hud-label">System {isRegister ? "Enrollment" : "Access"}</span>
        </div>

        <h1 className="hud-title text-2xl text-center mb-8">
          {isRegister ? "New User" : "Sign In"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="hud-label block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="hud-input w-full px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="hud-label block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="hud-input w-full px-3 py-2"
              required
            />
          </div>

          {error && (
            <p className="hud-label text-amber-400 border border-amber-500/40 bg-amber-500/10 px-3 py-2" style={{ color: '#ffb020' }}>
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
            onClick={() => setIsRegister(!isRegister)}
            className="text-cyan-400 underline"
            style={{ color: '#00e5ff' }}
          >
            {isRegister ? "Sign in" : "Register"}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthForm
