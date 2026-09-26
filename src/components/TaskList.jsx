import { useState, useEffect } from "react"
import {
  Pencil, Trash2, Plus, SlidersHorizontal,
  SignalLow, SignalMedium, SignalHigh,
} from "lucide-react"
import { getTasks, createTask, updateTask, deleteTask, completeProject, reopenProject } from "../api.js"
import HudDatePicker from "./HudDatePicker.jsx"
import Tooltip from "./Tooltip.jsx"
import HudFrame from "./HudFrame.jsx"
import TickFrame from "./TickFrame.jsx"
import { useIsMobile } from "../hooks/useMediaQuery"
import { useProjectChannel, useRealtimeEvent, useDebouncedCallback } from "../hooks/useRealtime"

const PRIORITY_META = {
  High: { color: "#ffb020", label: "High", icon: SignalHigh },
  Medium: { color: "#00e5ff", label: "Medium", icon: SignalMedium },
  Low: { color: "#0a8fa8", label: "Low", icon: SignalLow },
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
  const [showFilters, setShowFilters] = useState(false)
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
  const isMobile = useIsMobile()

  const filtersActive = filterPriority !== "All" || sortBy !== "priority"
  // Desktop list height: space left after header, form and (optional) filter panel
  const listOffset = showFilters ? 436 : 360

  useEffect(() => {
    loadTasks()
  }, [page, filterPriority, sortBy])

    // --- Realtime ---
  const refreshTasks = useDebouncedCallback(() => loadTasks({ silent: true }))

  useProjectChannel(project.id)

  useRealtimeEvent("TaskChanged", (e) => {
    if (e.projectId === project.id) refreshTasks()
  })

  useRealtimeEvent("ProjectChanged", (e) => {
    if (e.projectId !== project.id) return
    if (e.change === "deleted") {
      onBack() // the project no longer exists
      return
    }
    if (e.change === "completed") setIsCompleted(true)
    if (e.change === "reopened") setIsCompleted(false)
    refreshTasks()
  })

  useRealtimeEvent("Resync", refreshTasks)

  async function loadTasks({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true)
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

  const filterToggle = (
    <button
      type="button"
      onClick={() => setShowFilters((s) => !s)}
      className="hud-btn relative px-3 py-2 flex items-center justify-center shrink-0"
      aria-label={showFilters ? "Hide sort and filter" : "Show sort and filter"}
      aria-expanded={showFilters}
      aria-controls="task-filters"
      style={showFilters ? { background: 'color-mix(in srgb, var(--color-cyan) 25%, transparent)' } : undefined}
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      {filtersActive && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-amber)',
            boxShadow: '0 0 6px var(--color-amber)',
          }}
        />
      )}
    </button>
  )

  return (
    <div className="min-h-screen relative p-4">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button onClick={onBack} className="hud-label text-left" style={{ color: '#00e5ff' }}>
            ← Return to Mission Control
          </button>
          {isCompleted && (
            <span
              className="px-3 py-1 text-xs border shrink-0"
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

        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span className="hud-status-dot"></span>
            <span className="hud-label">Active Project</span>
          </div>
          {isAdmin && project.ownerUsername && (
            <span className="hud-label text-right" style={{ color: 'var(--color-cyan-dim)' }}>
              Owner: {project.ownerUsername}
            </span>
          )}
        </div>

        <div className="flex items-start md:items-center justify-between gap-3 mb-6">
          <h1 className="hud-title text-2xl md:text-3xl min-w-0" style={{ overflowWrap: 'anywhere' }}>
            {project.name}
          </h1>
          {isCompleted ? (
            <button
              onClick={handleReopenProject}
              disabled={completing}
              className="hud-btn py-2 px-4 text-sm whitespace-nowrap shrink-0"
            >
              {completing ? "..." : "Open Project"}
            </button>
          ) : (
            <Tooltip
              label="Marks the project done and locks all tasks from further changes"
              position={isMobile ? "left" : "right"}
              color="var(--color-green)"
              variant="frame"
              wrap
            >
              <button
                onClick={handleCompleteProject}
                disabled={completing}
                className="hud-btn hud-btn-complete py-2 px-4 text-sm whitespace-nowrap"
              >
                {completing ? "..." : "COMPLETE"}
              </button>
            </Tooltip>
          )}
        </div>

        {!isCompleted ? (
          <form
            onSubmit={handleCreate}
            className="hud-panel p-4 flex flex-col gap-3 mb-4"
            style={{ position: 'relative', zIndex: 10 }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="NEW TASK OBJECTIVE"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="hud-input flex-1 min-w-0 px-3 py-2"
              />
              {filterToggle}
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex gap-2 md:flex-1">
                {["Low", "Medium", "High"].map((level) => {
                  const isActive = newTaskPriority === level
                  const { color, icon: Icon } = PRIORITY_META[level]
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewTaskPriority(level)}
                      aria-pressed={isActive}
                      className="flex-1 py-2 text-base transition flex items-center justify-center"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.05em',
                        color: isActive ? '#030b0f' : color,
                        background: isActive ? color : 'transparent',
                        border: `1px solid ${color}`,
                      }}
                    >
                      <Icon size={18} className="md:hidden" aria-hidden="true" />
                      <span className="sr-only md:not-sr-only">{level}</span>
                    </button>
                  )
                })}
              </div>

              {/* On desktop "contents" lets these join the row above, same as before */}
              <div className="flex gap-2 md:contents">
                <div className="flex-1 min-w-0 relative">
                  <HudDatePicker value={newTaskDueDate} onChange={setNewTaskDueDate} />
                </div>
                <TickFrame type="submit" className="whitespace-nowrap">
                  <Plus size={18} className="md:hidden" aria-hidden="true" />
                  <span className="sr-only md:not-sr-only">Add</span>
                </TickFrame>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex justify-end mb-4">{filterToggle}</div>
        )}

        {showFilters && (
          <div id="task-filters" className="hud-panel p-3 flex gap-4 mb-6 items-center flex-wrap">
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
                const color = level === "All" ? "#eafcff" : PRIORITY_META[level].color
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setFilterPriority(level)
                      setPage(1)
                    }}
                    aria-pressed={isActive}
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
        )}

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
            {/* Fixed-height scroll area on desktop; normal page scroll on mobile */}
            <ul
            className="flex flex-col gap-3 pr-1 md:overflow-y-auto md:max-h-(--list-h) md:min-h-(--list-h)"
              style={{ '--list-h': `calc(100vh - ${listOffset}px)` }}
            >
              {tasks.map((task) => {
                const priority = PRIORITY_META[task.priority] || PRIORITY_META.Medium
                const PriorityIcon = priority.icon
                const due = formatDueDate(task.dueDate)
                const overdue = due && due.isOverdue && !task.isDone
                return (
                  <li
                    key={task.id}
                    className="hud-panel p-3 md:p-4 flex items-start md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                      <Tooltip
                        label={task.isDone ? "Mark incomplete" : "Complete"}
                        position="right"
                        color={task.isDone ? "var(--color-amber)" : "var(--color-green)"}
                      >
                        <input
                          type="checkbox"
                          checked={task.isDone}
                          onChange={() => handleToggleDone(task)}
                          disabled={isCompleted}
                          className="w-4 h-4 accent-cyan-400 mt-1 md:mt-0"
                        />
                      </Tooltip>

                      {/* Mobile: title on its own line, meta below. Desktop: badge · title · date in one row */}
                      <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 flex-1 min-w-0">
                        <span
                          className={`order-1 md:order-2 ${task.isDone ? "line-through opacity-40" : ""}`}
                          style={{ fontFamily: 'var(--font-mono)', overflowWrap: 'anywhere' }}
                        >
                          {task.title}
                        </span>

                        <div className="order-2 flex items-center gap-2 flex-wrap md:contents">
                          <span
                            className="md:order-1 inline-flex items-center px-2 py-0.5 text-xs shrink-0"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: priority.color,
                              border: `1px solid ${priority.color}`,
                              letterSpacing: '0.05em',
                            }}
                          >
                            <PriorityIcon size={14} className="md:hidden" aria-hidden="true" />
                            <span className="sr-only md:not-sr-only">{priority.label}</span>
                          </span>
                          {due && (
                            <span
                              className="md:order-3 hud-label shrink-0"
                              style={{ color: overdue ? '#ffb020' : undefined }}
                            >
                              {overdue ? '⚠ ' : ''}{due.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isCompleted && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => openEditModal(task)}
                          className="hud-btn p-2 md:px-3 md:py-1 text-xs flex items-center justify-center"
                        >
                          <Pencil size={14} className="md:hidden" aria-hidden="true" />
                          <span className="sr-only md:not-sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteTask(task)}
                          className="hud-btn hud-btn-delete p-2 md:px-3 md:py-1 text-xs flex items-center justify-center"
                        >
                          <Trash2 size={14} className="md:hidden" aria-hidden="true" />
                          <span className="sr-only md:not-sr-only">Delete</span>
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="hud-panel p-3 flex items-center justify-between gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="hud-btn px-3 py-1 text-xs"
                aria-label="Previous page"
              >
                ←<span className="hidden sm:inline"> Prev</span>
              </button>
              <span className="hud-label text-center">
                Page {page} of {totalPages}
                <span className="hidden sm:inline"> · {totalCount} total</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="hud-btn px-3 py-1 text-xs"
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next </span>→
              </button>
            </div>
          </>
        )}

        {confirmDeleteTask && (
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

              <h2 className="hud-title hud-title-danger text-lg mb-3">Delete task?</h2>

              <p className="mb-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>
                "{confirmDeleteTask.title}" will be permanently removed. This cannot be undone.
              </p>

              {/* Stacked on narrow screens (Confirm on top), side by side from sm up */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button onClick={() => setConfirmDeleteTask(null)} className="hud-btn flex-auto whitespace-nowrap py-2">
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} className="hud-btn hud-btn-delete flex-auto whitespace-nowrap py-2">
                  Confirm Delete
                </button>
              </div>
            </HudFrame>
          </div>
        )}

        {editingTask && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(3, 11, 15, 0.85)' }}
          >
            <HudFrame
              size="lg"
              className="max-w-sm w-full"
              bodyClassName="p-6"
              style={{ zIndex: 10 }}
            >
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
                    const { color } = PRIORITY_META[level]
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditPriority(level)}
                        aria-pressed={isActive}
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
            </HudFrame>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskList