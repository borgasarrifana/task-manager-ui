import { useState, useEffect, useMemo } from "react"
import { getTasks, createTask, updateTask, deleteTask } from "./api"

const PRIORITY_COLORS = {
  High: { color: "#ffb020", label: "High" },
  Medium: { color: "#00e5ff", label: "Medium" },
  Low: { color: "#0a8fa8", label: "Low" },
}

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

function TaskList({ token, project, onBack }) {
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("Medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("priority") // "priority" | "dueDate" | "created"
  const [filterPriority, setFilterPriority] = useState("All")

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
      await createTask(token, project.id, newTaskTitle, newTaskPriority, newTaskDueDate || null)
      setNewTaskTitle("")
      setNewTaskPriority("Medium")
      setNewTaskDueDate("")
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleToggleDone(task) {
    try {
      await updateTask(token, task.id, task.title, !task.isDone, task.priority, task.dueDate)
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

  const visibleTasks = useMemo(() => {
    let result = [...tasks]

    if (filterPriority !== "All") {
      result = result.filter((t) => t.priority === filterPriority)
    }

    if (sortBy === "priority") {
      result.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    } else if (sortBy === "dueDate") {
      result.sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate) - new Date(b.dueDate)
      })
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return result
  }, [tasks, sortBy, filterPriority])

  function formatDueDate(dueDate) {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const isOverdue = date < new Date() && date.toDateString() !== new Date().toDateString()
    return { text: date.toLocaleDateString(), isOverdue }
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

        <form onSubmit={handleCreate} className="hud-panel p-4 flex flex-col gap-3 mb-4">
          <input
            type="text"
            placeholder="NEW TASK OBJECTIVE"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="hud-input px-3 py-2"
          />
          <div className="flex gap-2">
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="hud-input px-3 py-2 flex-1"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="hud-input px-3 py-2 flex-1"
            />
            <button type="submit" className="hud-btn px-4 py-2 whitespace-nowrap">
              Add
            </button>
          </div>
        </form>

        <div className="hud-panel p-3 flex gap-4 mb-6 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="hud-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="hud-input px-2 py-1 text-sm"
              style={{ fontSize: '0.8rem' }}
            >
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="created">Newest</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="hud-label">Filter:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="hud-input px-2 py-1 text-sm"
              style={{ fontSize: '0.8rem' }}
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="hud-label px-3 py-2 mb-4 border" style={{ color: '#ffb020', borderColor: 'rgba(255,176,32,0.4)', background: 'rgba(255,176,32,0.1)' }}>
            ⚠ {error}
          </p>
        )}

        {loading ? (
          <p className="hud-label">Scanning...</p>
        ) : visibleTasks.length === 0 ? (
          <p className="hud-label">No objectives match current filters.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleTasks.map((task) => {
              const priorityInfo = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium
              const due = formatDueDate(task.dueDate)
              return (
                <li
                  key={task.id}
                  className="hud-panel p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={task.isDone}
                      onChange={() => handleToggleDone(task)}
                      className="w-4 h-4 accent-cyan-400"
                    />
                    <span
                      className="px-2 py-0.5 text-xs shrink-0"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: priorityInfo.color,
                        border: `1px solid ${priorityInfo.color}`,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {priorityInfo.label}
                    </span>
                    <span
                      className={task.isDone ? "line-through opacity-40" : ""}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {task.title}
                    </span>
                    {due && (
                      <span
                        className="hud-label shrink-0"
                        style={{ color: due.isOverdue && !task.isDone ? '#ffb020' : undefined }}
                      >
                        {due.isOverdue && !task.isDone ? '⚠ ' : ''}{due.text}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="hud-btn hud-btn-danger px-3 py-1 text-xs ml-3 shrink-0"
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TaskList 