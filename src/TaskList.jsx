import { useState, useEffect } from "react"
import { getTasks, createTask, updateTask, deleteTask, completeProject, reopenProject } from "./api"
import HudDatePicker from "./HudDatePicker.jsx"

const PRIORITY_COLORS = {
  High: { color: "#ffb020", label: "High" },
  Medium: { color: "#00e5ff", label: "Medium" },
  Low: { color: "#0a8fa8", label: "Low" },
}

function TaskList({ token, role, project, onBack }) {
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("Medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("priority") // "priority" | "dueDate" | "created"
  const [filterPriority, setFilterPriority] = useState("All")
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editPriority, setEditPriority] = useState("Medium")
  const [editDueDate, setEditDueDate] = useState("")
  const [isCompleted, setIsCompleted] = useState(project.isCompleted)
  const [completing, setCompleting] = useState(false)
  const isAdmin = role === "Admin"
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadTasks()
  }, [page, filterPriority, sortBy])

  async function loadTasks() {
    try {
      setLoading(true)
      const data = await getTasks(token, project.id, page, 10, filterPriority, sortBy)
      setTasks(data.items)
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

  async function handleConfirmDelete() {
    if (!confirmDeleteTask) return
    try {
      await deleteTask(token, confirmDeleteTask.id)
      setConfirmDeleteTask(null)
      if (tasks.length === 1 && page > 1) {
        setPage((p) => p - 1)
      } else {
        loadTasks()
      }
    } catch (err) {
      setError(err.message)
      setConfirmDeleteTask(null)
    }
  }

  async function handleCompleteProject() {
    setCompleting(true)
    try {
      await completeProject(token, project.id)
      setIsCompleted(true)
      loadTasks()
    } catch (err) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  async function handleReopenProject() {
    setCompleting(true)
    try {
      await reopenProject(token, project.id)
      setIsCompleted(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  function formatDueDate(dueDate) {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const isOverdue = date < new Date() && date.toDateString() !== new Date().toDateString()
    return { text: date.toLocaleDateString(), isOverdue }
  }

  function openEditModal(task) {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditPriority(task.priority)
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editTitle.trim()) return
    try {
      await updateTask(token, editingTask.id, editTitle, editingTask.isDone, editPriority, editDueDate || null)
      setEditingTask(null)
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen relative p-4">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="hud-label" style={{ color: '#00e5ff' }}>
            ← Return to Mission Control
          </button>
          {isCompleted && (
            <span
              className="px-3 py-1 text-xs border"
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
          )}
        </div>

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="hud-status-dot"></span>
            <span className="hud-label">Active Project</span>
          </div>
          {isAdmin && project.ownerUsername && (
            <span className="hud-label" style={{ color: 'var(--color-cyan-dim)' }}>
              Owner: {project.ownerUsername}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="hud-title text-3xl">{project.name}</h1>
          {isCompleted ? (
            <button
              onClick={handleReopenProject}
              disabled={completing}
              className="hud-btn py-2 px-4 text-sm"
            >
              {completing ? "..." : "Open Project"}
            </button>
          ) : (
            <button
              onClick={handleCompleteProject}
              disabled={completing}
              className="hud-btn hud-btn-complete py-2 px-4 text-sm"
            >
              {completing ? "..." : "COMPLETE"}
            </button>
          )}
        </div>

        {!isCompleted && (
          <form
            onSubmit={handleCreate}
            className="hud-panel p-4 flex flex-col gap-3 mb-4"
            style={{ position: 'relative', zIndex: 10 }}
          >
            <input
              type="text"
              placeholder="NEW TASK OBJECTIVE"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="hud-input px-3 py-2"
            />
            <div className="flex gap-2">
              <div className="flex gap-2 flex-1">
                {["Low", "Medium", "High"].map((level) => {
                  const isActive = newTaskPriority === level
                  const color = level === "High" ? "#ffb020" : level === "Medium" ? "#00e5ff" : "#0a8fa8"
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewTaskPriority(level)}
                      className="flex-1 py-2 text-base transition"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.05em',
                        color: isActive ? '#030b0f' : color,
                        background: isActive ? color : 'transparent',
                        border: `1px solid ${color}`,
                      }}
                    >
                      {level}
                    </button>
                  )
                })}
              </div>
              <div className="flex-1 relative">
                <HudDatePicker value={newTaskDueDate} onChange={setNewTaskDueDate} />
              </div>
              <button type="submit" className="hud-btn px-4 py-2 whitespace-nowrap">
                Add
              </button>
            </div>
          </form>
        )}

        <div className="hud-panel p-3 flex gap-4 mb-6 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="hud-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              className="hud-input px-2 py-1 text-sm"
              style={{ fontSize: '0.8rem' }}
            >
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="created">Newest</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hud-label">Filter:</span>
            {["All", "High", "Medium", "Low"].map((level) => {
              const isActive = filterPriority === level
              const color = level === "High" ? "#ffb020" : level === "Medium" ? "#00e5ff" : level === "Low" ? "#0a8fa8" : "#eafcff"
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setFilterPriority(level)
                    setPage(1)
                  }}
                  className="px-2 py-0.5 text-xs transition"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.05em',
                    color: isActive ? '#030b0f' : color,
                    background: isActive ? color : 'transparent',
                    border: `1px solid ${color}`,
                  }}
                >
                  {level}
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <p className="hud-label px-3 py-2 mb-4 border" style={{ color: '#ffb020', borderColor: 'rgba(255,176,32,0.4)', background: 'rgba(255,176,32,0.1)' }}>
            ⚠ {error}
          </p>
        )}

        {loading ? (
          <p className="hud-label">Scanning...</p>
        ) : tasks.length === 0 ? (
          <p className="hud-label">No objectives match current filters.</p>
        ) : (
          <>
            <ul
              className="flex flex-col gap-3 overflow-y-auto pr-1"
              style={{ maxHeight: 'calc(100vh - 436px)', minHeight: 'calc(100vh - 436px)' }}
            >
              {tasks.map((task) => {
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
                        disabled={isCompleted}
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
                    {!isCompleted && (
                      <div className="flex gap-2 ml-3 shrink-0">
                        <button
                          onClick={() => openEditModal(task)}
                          className="hud-btn px-3 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteTask(task)}
                          className="hud-btn hud-btn-delete px-3 py-1 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

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
          </>
        )}

        {confirmDeleteTask && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(3, 11, 15, 0.85)' }}
          >
            <div className="hud-panel p-6 max-w-sm w-full">
              <div className="flex items-center gap-2 mb-3">
                <span className="hud-status-dot" style={{ background: '#ffb020', boxShadow: '0 0 6px #ffb020' }}></span>
                <span className="hud-label" style={{ color: '#ffb020' }}>Confirmation Required</span>
              </div>

              <h2 className="hud-title text-lg mb-3">Delete task?</h2>

              <p className="mb-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                "{confirmDeleteTask.title}" will be permanently removed. This cannot be undone.
              </p>

              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteTask(null)} className="hud-btn flex-1 py-2">
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} className="hud-btn hud-btn-delete flex-1 py-2">
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {editingTask && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(3, 11, 15, 0.85)' }}
          >
            <div className="hud-panel p-6 max-w-sm w-full" style={{ position: 'relative', zIndex: 10 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="hud-status-dot"></span>
                <span className="hud-label">Edit Objective</span>
              </div>

              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="hud-input px-3 py-2 text-base"
                  required
                />

                <div className="flex gap-2">
                  {["Low", "Medium", "High"].map((level) => {
                    const isActive = editPriority === level
                    const color = level === "High" ? "#ffb020" : level === "Medium" ? "#00e5ff" : "#0a8fa8"
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditPriority(level)}
                        className="flex-1 py-2 text-base transition"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.05em',
                          color: isActive ? '#030b0f' : color,
                          background: isActive ? color : 'transparent',
                          border: `1px solid ${color}`,
                        }}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>

                <HudDatePicker value={editDueDate} onChange={setEditDueDate} />

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="hud-btn flex-1 py-2"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="hud-btn flex-1 py-2">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskList