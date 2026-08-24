import { useState } from "react"
import AuthForm from "./AuthForm"
import ProjectList from "./ProjectList"
import TaskList from "./TaskList"
import UsersPage from "./UsersPage"
import Sidebar from "./Sidebar"

function App() {
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState(null)
  const [role, setRole] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showUsers, setShowUsers] = useState(false)

  function handleLoginSuccess(newToken, newUsername, newRole) {
    setToken(newToken)
    setUsername(newUsername)
    setRole(newRole)
  }

  function handleLogout() {
    setToken(null)
    setUsername(null)
    setRole(null)
    setSelectedProject(null)
    setShowUsers(false)
  }

  function handleGoHome() {
    setSelectedProject(null)
    setShowUsers(false)
  }

  function handleShowUsers() {
    setSelectedProject(null)
    setShowUsers(true)
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
