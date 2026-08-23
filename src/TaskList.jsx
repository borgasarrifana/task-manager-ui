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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="text-blue-600 hover:underline mb-4 text-sm font-medium"
        >
          ← Back to Projects
        </button>

        <h1 className="text-2xl font-bold mb-6">{project.name}</h1>

        <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="New task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
          >
            Add Task
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">No tasks yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="bg-white p-4 rounded shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.isDone}
                    onChange={() => handleToggleDone(task)}
                    className="w-4 h-4"
                  />
                  <span className={task.isDone ? "line-through text-gray-400" : ""}>
                    {task.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
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