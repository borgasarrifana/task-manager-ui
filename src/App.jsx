import { useState } from "react"
import AuthForm from "./AuthForm"
import ProjectList from "./ProjectList"
import TaskList from "./TaskList"

function App() {
  const [token, setToken] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)

  if (!token) {
    return <AuthForm onLoginSuccess={setToken} />
  }

  if (!selectedProject) {
    return <ProjectList token={token} onSelectProject={setSelectedProject} />
  }

  return (
    <TaskList
      token={token}
      project={selectedProject}
      onBack={() => setSelectedProject(null)}
    />
  )
}

export default App