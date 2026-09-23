import { useState, useEffect } from "react"
import { getProjects, createProject, getTasks, deleteProject } from "../api"
import HudFrame from "./HudFrame.jsx"

function ProjectList({ token, role, onSelectProject }) {
  const [projects, setProjects] = useState([])
  const [newProjectName, setNewProjectName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [confirmTarget, setConfirmTarget] = useState(null) // { project, taskCount }
  const [checkingProjectId, setCheckingProjectId] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const isAdmin = role === "Admin"

  useEffect(() => {
    loadProjects()
  }, [page])

  async function loadProjects() {
    try {
      setLoading(true)
      const data = await getProjects(token, page)
      setProjects(data.items)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
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

  async function handleDeleteClick(project) {
    setCheckingProjectId(project.id)
    try {
      const taskData = await getTasks(token, project.id, 1, 1)
      setConfirmTarget({ project, taskCount: taskData.totalCount })
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingProjectId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return
    try {
      await deleteProject(token, confirmTarget.project.id)
      setConfirmTarget(null)
      if (projects.length === 1 && page > 1) {
        setPage((p) => p - 1)
      } else {
        loadProjects()
      }
    } catch (err) {
      setError(err.message)
      setConfirmTarget(null)
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
          <>
            <ul className="flex flex-col gap-3">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="hud-panel p-4 flex items-center justify-between"
                >
                  <div
                    onClick={() => onSelectProject(project)}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="hud-title text-base">
                      {project.name}
                    </span>
                    {isAdmin && project.ownerUsername && (
                      <div className="hud-label mt-1" style={{ color: 'var(--color-cyan-dim)' }}>
                        Owner: {project.ownerUsername}
                      </div>
                    )}
                  </div>

                  {project.isCompleted ? (
                    <span
                      className="px-3 py-1 text-xs ml-3 border"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--color-green)',
                        borderColor: 'var(--color-green)',
                        background: 'color-mix(in srgb, var(--color-green) 10%, transparent)',
                      }}
                    >
                      Complete
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteClick(project)}
                      disabled={checkingProjectId === project.id}
                      className="hud-btn hud-btn-delete px-3 py-1 text-xs ml-3"
                    >
                      {checkingProjectId === project.id ? "..." : "Delete"}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="hud-panel p-3 flex items-center justify-between mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="hud-btn px-3 py-1 text-xs"
                >
                  ← Prev
                </button>
                <span className="hud-label">
                  Page {page} of {totalPages} · {totalCount} total
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="hud-btn px-3 py-1 text-xs"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {confirmTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(3, 11, 15, 0.85)' }}
        >
          <HudFrame
              size="lg"
              accent="var(--color-red)"
              className="max-w-sm w-full"
              bodyClassName="p-6"
              style={{ zIndex: 10 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="hud-status-dot" style={{ background: '#ffb020', boxShadow: '0 0 6px #ffb020' }}></span>
              <span className="hud-label" style={{ color: '#ffb020' }}>Confirmation Required</span>
            </div>

            <h2 className="hud-title hud-title-danger text-lg mb-3">Delete "{confirmTarget.project.name}"?</h2>

            {confirmTarget.taskCount > 0 ? (
              <p className="mb-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                This project contains{" "}
                <span style={{ color: '#ffb020' }}>{confirmTarget.taskCount}</span>{" "}
                {confirmTarget.taskCount === 1 ? "task" : "tasks"}. Deleting this project will
                permanently remove {confirmTarget.taskCount === 1 ? "it" : "all of them"} as well.
                This cannot be undone.
              </p>
            ) : (
              <p className="mb-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                This project has no tasks. This action cannot be undone.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="hud-btn flex-1 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="hud-btn hud-btn-delete flex-1 py-2"
              >
                Confirm Delete
              </button>
            </div>
          </HudFrame>
        </div>
      )}
    </div>
  )
}

export default ProjectList