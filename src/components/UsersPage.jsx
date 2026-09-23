import { useState, useEffect } from "react"
import { getUsers, getUserProjects, updateUserRole, updateUser, deleteUser } from "../api"
import HudFrame from "./HudFrame.jsx"

function UsersPage({ token, currentUsername }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [confirmTarget, setConfirmTarget] = useState(null) // { user, projectCount }
  const [checkingUserId, setCheckingUserId] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadUsers()
  }, [page])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await getUsers(token, page)
      setUsers(data.items)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleRole(user) {
    const newRole = user.role === "Admin" ? "Member" : "Admin"
    setUpdatingId(user.id)
    try {
      await updateUserRole(token, user.id, newRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  function handleEditClick(user) {
    setEditingId(user.id)
    setEditValue(user.username)
    setError("")
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditValue("")
  }

  async function handleSaveEdit(user) {
    if (!editValue.trim() || editValue === user.username) {
      handleCancelEdit()
      return
    }
    setUpdatingId(user.id)
    try {
      await updateUser(token, user.id, editValue.trim())
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, username: editValue.trim() } : u))
      )
      handleCancelEdit()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDeleteClick(user) {
    setCheckingUserId(user.id)
    try {
      const projects = await getUserProjects(token, user.id)
      setConfirmTarget({ user, projectCount: projects.length })
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingUserId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return
    try {
      await deleteUser(token, confirmTarget.user.id)
      setConfirmTarget(null)
      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1)
      } else {
        loadUsers()
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
          <span className="hud-label">Access Control</span>
        </div>
        <h1 className="hud-title text-3xl mb-6">Users</h1>

        {error && (
          <p
            className="hud-label px-3 py-2 mb-4 border"
            style={{
              color: 'var(--color-amber)',
              borderColor: 'color-mix(in srgb, var(--color-amber) 40%, transparent)',
              background: 'color-mix(in srgb, var(--color-amber) 10%, transparent)',
            }}
          >
            ⚠ {error}
          </p>
        )}

        {loading ? (
          <p className="hud-label">Scanning...</p>
        ) : users.length === 0 ? (
          <p className="hud-label">No users found.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {users.map((user) => {
              const isSelf = user.username === currentUsername
              const isAdmin = user.role === "Admin"
              const isEditing = editingId === user.id
              const isBusy = updatingId === user.id

              return (
                <li
                  key={user.id}
                  className="hud-panel p-4 flex items-center justify-between gap-3"
                >
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="hud-input px-3 py-2 flex-1"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(user)}
                          disabled={isBusy}
                          className="hud-btn px-3 py-1 text-xs"
                        >
                          {isBusy ? "..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="hud-btn px-3 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="hud-title text-base">{user.username}</div>
                        <div
                          className="hud-label mt-1"
                          style={{ color: isAdmin ? 'var(--color-amber)' : 'var(--color-cyan-dim)' }}
                        >
                          {user.role}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={isBusy || isSelf}
                          title={isSelf ? "You can't change your own role" : undefined}
                          className={`hud-btn px-3 py-1 text-xs ${isAdmin ? 'hud-btn-danger' : ''}`}
                        >
                          {isBusy ? "..." : isAdmin ? "Demote" : "Promote"}
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="hud-btn px-3 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          disabled={checkingUserId === user.id || isSelf}
                          title={isSelf ? "You can't delete your own account" : undefined}
                          className="hud-btn hud-btn-delete px-3 py-1 text-xs"
                        >
                          {checkingUserId === user.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
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
              <span className="hud-status-dot" style={{ background: 'var(--color-amber)', boxShadow: '0 0 6px var(--color-amber)' }}></span>
              <span className="hud-label" style={{ color: 'var(--color-amber)' }}>Confirmation Required</span>
            </div>

            <h2 className="hud-title hud-title-danger text-lg mb-3">Delete "{confirmTarget.user.username}"?</h2>

            {confirmTarget.projectCount > 0 ? (
              <p className="mb-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                This user owns{" "}
                <span style={{ color: 'var(--color-amber)' }}>{confirmTarget.projectCount}</span>{" "}
                {confirmTarget.projectCount === 1 ? "project" : "projects"}. Deleting this user will
                permanently remove {confirmTarget.projectCount === 1 ? "it" : "all of them"}, along
                with every task inside. This cannot be undone.
              </p>
            ) : (
              <p className="mb-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                This user owns no projects. This action cannot be undone.
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

export default UsersPage
