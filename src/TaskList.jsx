import { useState, useEffect } from "react"
import { getTasks, createTask, updateTask, deleteTask } from "./api"

function TaskList({ token, project, onBack }) {
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      setLoading(true)
      const data = await getTasks(token, project.id)
      setTasks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      await createTask(token, project.id, newTaskTitle)
      setNewTaskTitle("")
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleToggleDone(task) {
    try {
      await updateTask(token, task.id, task.title, !task.isDone)
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(taskId) {
    try {
      await deleteTask(token, taskId)
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen relative p-8">
      <div className="max-w-2xl mx-auto relative z-10">
        <button onClick={onBack} className="hud-label mb-4" style={{ color: '#00e5ff' }}>
          ← Return to Mission Control
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="hud-status-dot"></span>
          <span className="hud-label">Active Project</span>
        </div>
        <h1 className="hud-title text-3xl mb-6">{project.name}</h1>

        <form onSubmit={handleCreate} className="hud-panel p-4 flex gap-2 mb-6">
          <input
            type="text"
            placeholder="NEW TASK OBJECTIVE"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="hud-input flex-1 px-3 py-2"
          />
          <button type="submit" className="hud-btn px-4 py-2">
            Add
          </button>
        </form>

        {error && (
          <p className="hud-label px-3 py-2 mb-4 border" style={{ color: '#ffb020', borderColor: 'rgba(255,176,32,0.4)', background: 'rgba(255,176,32,0.1)' }}>
            ⚠ {error}
          </p>
        )}

        {loading ? (
          <p className="hud-label">Scanning...</p>
        ) : tasks.length === 0 ? (
          <p className="hud-label">No objectives logged. Add one above.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="hud-panel p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.isDone}
                    onChange={() => handleToggleDone(task)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                  <span
                    className={task.isDone ? "line-through opacity-40" : ""}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {task.title}
                  </span>
                  {task.isDone && (
                    <span className="hud-label" style={{ color: '#00e5ff' }}>Complete</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="hud-btn hud-btn-danger px-3 py-1 text-xs"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TaskList