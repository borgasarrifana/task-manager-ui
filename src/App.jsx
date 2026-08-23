import { useState } from "react"
import AuthForm from "./AuthForm"
import ProjectList from "./ProjectList"
import TaskList from "./TaskList"
import Sidebar from "./Sidebar"

function App() {
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)

  function handleLoginSuccess(newToken, newUsername) {
    setToken(newToken)
    setUsername(newUsername)
  }

  function handleLogout() {
    setToken(null)
    setUsername(null)
    setSelectedProject(null)
  }

  if (!token) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div>
      <Sidebar
        username={username}
        onLogout={handleLogout}
        selectedProject={selectedProject}
        onGoHome={() => setSelectedProject(null)}
      />
      {!selectedProject ? (
        <ProjectList token={token} onSelectProject={setSelectedProject} />
      ) : (
        <TaskList
          token={token}
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      )}
    </div>
  )
}

export default App