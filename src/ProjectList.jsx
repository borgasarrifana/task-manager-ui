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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Projects</h1>

        <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="New project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
          >
            Add Project
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">No projects yet. Create one above.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="bg-white p-4 rounded shadow-sm cursor-pointer hover:bg-blue-50 transition"
              >
                {project.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ProjectList