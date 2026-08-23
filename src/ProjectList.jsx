import { useState, useEffect } from "react"
import { getProjects, createProject } from "./api"

function ProjectList({ token, onSelectProject }) {
  const [projects, setProjects] = useState([])
  const [newProjectName, setNewProjectName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      setLoading(true)
      const data = await getProjects(token)
      setProjects(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    try {
      await createProject(token, newProjectName)
      setNewProjectName("")
      loadProjects()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen relative p-8">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="hud-status-dot"></span>
          <span className="hud-label">Mission Control</span>
        </div>
        <h1 className="hud-title text-3xl mb-6">Projects</h1>

        <form onSubmit={handleCreate} className="hud-panel p-4 flex gap-2 mb-6">
          <input
            type="text"
            placeholder="NEW PROJECT DESIGNATION"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="hud-input flex-1 px-3 py-2"
          />
          <button type="submit" className="hud-btn px-4 py-2">
            Deploy
          </button>
        </form>

        {error && (
          <p className="hud-label px-3 py-2 mb-4 border" style={{ color: '#ffb020', borderColor: 'rgba(255,176,32,0.4)', background: 'rgba(255,176,32,0.1)' }}>
            ⚠ {error}
          </p>
        )}

        {loading ? (
          <p className="hud-label">Scanning...</p>
        ) : projects.length === 0 ? (
          <p className="hud-label">No active projects. Deploy one above.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((project) => (
              <li
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="hud-panel p-4 cursor-pointer transition hover:bg-cyan-500/5 flex items-center justify-between"
              >
                <span className="hud-title text-base">{project.name}</span>
                <span className="hud-label" style={{ color: '#00e5ff' }}>→</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ProjectList