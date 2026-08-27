import { useState, useEffect } from "react"
import AuthForm from "./AuthForm"
import ProjectList from "./ProjectList"
import TaskList from "./TaskList"
import UsersPage from "./UsersPage"
import Sidebar from "./Sidebar"
import { refreshAccessToken, logout as apiLogout, setSessionHandlers } from "./api"

function App() {
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState(null)
  const [role, setRole] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showUsers, setShowUsers] = useState(false)
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    setSessionHandlers({
      onTokensUpdated: (newToken, newRefreshToken) => {
        setToken(newToken)
        localStorage.setItem("token", newToken)
        localStorage.setItem("refreshToken", newRefreshToken)
      },
      onSessionExpired: () => {
        clearSession()
      },
    })

    async function restoreSession() {
      const storedRefreshToken = localStorage.getItem("refreshToken")
      const storedUsername = localStorage.getItem("username")

      if (!storedRefreshToken) {
        setRestoring(false)
        return
      }

      try {
        const data = await refreshAccessToken(storedRefreshToken)
        setToken(data.token)
        setUsername(storedUsername)
        setRole(data.role)
        localStorage.setItem("token", data.token)
        localStorage.setItem("refreshToken", data.refreshToken)
        localStorage.setItem("role", data.role)
      } catch {
        clearSession()
      } finally {
        setRestoring(false)
      }
    }

    restoreSession()
  }, [])

  function clearSession() {
    setToken(null)
    setUsername(null)
    setRole(null)
    setSelectedProject(null)
    setShowUsers(false)
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("username")
    localStorage.removeItem("role")
  }

  function handleLoginSuccess(newToken, newRefreshToken, newUsername, newRole) {
    setToken(newToken)
    setUsername(newUsername)
    setRole(newRole)
    localStorage.setItem("token", newToken)
    localStorage.setItem("refreshToken", newRefreshToken)
    localStorage.setItem("username", newUsername)
    localStorage.setItem("role", newRole)
  }

  function handleLogout() {
    const storedRefreshToken = localStorage.getItem("refreshToken")
    if (storedRefreshToken) {
      apiLogout(storedRefreshToken).catch(() => {})
    }
    clearSession()
  }

  function handleGoHome() {
    setSelectedProject(null)
    setShowUsers(false)
  }

  function handleShowUsers() {
    setSelectedProject(null)
    setShowUsers(true)
  }

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="hud-label">Restoring session...</p>
      </div>
    )
  }

  if (!token) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div>
      <Sidebar
        username={username}
        role={role}
        onLogout={handleLogout}
        selectedProject={selectedProject}
        onGoHome={handleGoHome}
        showUsers={showUsers}
        onShowUsers={handleShowUsers}
      />
      {showUsers ? (
        <UsersPage token={token} currentUsername={username} />
      ) : !selectedProject ? (
        <ProjectList token={token} role={role} onSelectProject={setSelectedProject} />
      ) : (
        <TaskList
          token={token}
          role={role}
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      )}
    </div>
  )
}

export default App