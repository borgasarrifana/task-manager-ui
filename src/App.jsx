import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import AuthForm from "./components/AuthForm"
import DashboardPage from "./components/DashboardPage"
import ProjectList from "./components/ProjectList"
import TaskList from "./components/TaskList"
import UsersPage from "./components/UsersPage"
import Sidebar from "./components/Sidebar"
import { useIsMobile } from "./hooks/useMediaQuery"
import { refreshAccessToken, logout as apiLogout, setSessionHandlers } from "./api"
import { startRealtime, stopRealtime } from "./realtime"

function App() {
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState(null)
  const [role, setRole] = useState(null)
  const [view, setView] = useState("dashboard") // "dashboard" | "projects" | "users"
  const [selectedProject, setSelectedProject] = useState(null)
  const [restoring, setRestoring] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isMobile = useIsMobile()

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

  // Close the drawer when resizing up to desktop
  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false)
  }, [isMobile])

  // Esc closes the drawer; lock page scroll while it's open
  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e) => e.key === "Escape" && setMobileNavOpen(false)
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [mobileNavOpen])

  function clearSession() {
    setToken(null)
    setUsername(null)
    setRole(null)
    setView("dashboard")
    setSelectedProject(null)
    setMobileNavOpen(false)
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("username")
    localStorage.removeItem("role")
  }

  function handleLoginSuccess(newToken, newRefreshToken, newUsername, newRole) {
    setToken(newToken)
    setUsername(newUsername)
    setRole(newRole)
    setView("dashboard")
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

  function showView(nextView) {
    setSelectedProject(null)
    setView(nextView)
  }

  // One realtime connection per logged-in session.
  // Depends on "is logged in", not the token itself, so token refreshes don't reconnect.
  const isAuthenticated = !!token
  useEffect(() => {
    if (!isAuthenticated) return
    startRealtime()
    return () => stopRealtime()
  }, [isAuthenticated])

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

  function renderPage() {
    if (selectedProject) {
      return (
        <TaskList
          token={token}
          role={role}
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      )
    }
    if (view === "users") {
      return <UsersPage token={token} currentUsername={username} />
    }
    if (view === "projects") {
      return <ProjectList token={token} role={role} onSelectProject={setSelectedProject} />
    }
    return (
      <DashboardPage
        token={token}
        role={role}
        onOpenProject={setSelectedProject}
        onShowProjects={() => showView("projects")}
      />
    )
  }

  return (
    <div>
      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 inset-x-0 h-14 flex items-center gap-3 px-4"
        style={{
          zIndex: 30,
          background: "var(--color-panel)",
          borderBottom: "1px solid color-mix(in srgb, var(--color-cyan) 25%, transparent)",
        }}
      >
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="hud-btn p-2 flex items-center justify-center"
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <span className="hud-title text-sm">Task Manager</span>
      </header>

      <Sidebar
        username={username}
        role={role}
        onLogout={handleLogout}
        selectedProject={selectedProject}
        currentView={view}
        onShowDashboard={() => showView("dashboard")}
        onGoHome={() => showView("projects")}
        showUsers={view === "users"}
        onShowUsers={() => showView("users")}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <main className="pt-14 md:pt-0">{renderPage()}</main>
    </div>
  )
}

export default App