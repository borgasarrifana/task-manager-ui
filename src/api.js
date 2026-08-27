const API_BASE = "https://task-manager-api-1-iusg.onrender.com/api"

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Registration failed")
  }
  return res.text()
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Login failed")
  }
  return res.json() // { token: "...", role: "..." }
}

export async function getProjects(token, page = 1, pageSize = 20) {
  const res = await fetch(`${API_BASE}/projects?page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to load projects")
  return res.json() // { items, page, pageSize, totalCount, totalPages }
}

export async function createProject(token, name) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to create project")
  }
  return res.json()
}

export async function getTasks(token, projectId, page = 1, pageSize = 10, priority = null, sortBy = null) {
  const params = new URLSearchParams({ page, pageSize })
  if (priority && priority !== "All") {
    params.set("priority", priority)
  }
  if (sortBy) {
    params.set("sortBy", sortBy)
  }
  const res = await fetch(`${API_BASE}/projects/${projectId}/tasks?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to load tasks")
  return res.json()
}

export async function createTask(token, projectId, title, priority = "Medium", dueDate = null) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, priority, dueDate }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to create task")
  }
  return res.json()
}

export async function updateTask(token, taskId, title, isDone, priority, dueDate) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, isDone, priority, dueDate }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to update task")
  }
}

export async function deleteTask(token, taskId) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to delete task")
  }
}

export async function deleteProject(token, projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to delete project")
}

export async function completeProject(token, projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/complete`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to complete project")
  }
}

export async function reopenProject(token, projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/reopen`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to reopen project")
  }
}

export async function getUsers(token, page = 1, pageSize = 20) {
  const res = await fetch(`${API_BASE}/users?page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to load users")
  return res.json() // { items, page, pageSize, totalCount, totalPages }
}

export async function getUserProjects(token, userId) {
  const res = await fetch(`${API_BASE}/users/${userId}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to load user's projects")
  return res.json()
}

export async function updateUserRole(token, userId, role) {
  const res = await fetch(`${API_BASE}/users/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to update role")
  }
}

export async function updateUser(token, userId, username) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to update user")
  }
}

export async function deleteUser(token, userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to delete user")
  }
}