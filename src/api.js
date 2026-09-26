const API_BASE = "https://task-manager-api-1-iusg.onrender.com/api"

// --- Session handling ---------------------------------------------------

let sessionHandlers = {
  onTokensUpdated: () => {},
  onSessionExpired: () => {},
}

export function setSessionHandlers(handlers) {
  sessionHandlers = handlers
}

let refreshingPromise = null

async function authorizedFetch(url, options, token) {
  const doFetch = (authToken) =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${authToken}`,
      },
    })

  let res = await doFetch(token)

  if (res.status === 401) {
    const storedRefreshToken = localStorage.getItem("refreshToken")
    if (!storedRefreshToken) {
      sessionHandlers.onSessionExpired()
      throw new Error("Session expired")
    }

    if (!refreshingPromise) {
      refreshingPromise = refreshAccessToken(storedRefreshToken)
        .then((data) => {
          sessionHandlers.onTokensUpdated(data.token, data.refreshToken)
          return data.token
        })
        .catch((err) => {
          sessionHandlers.onSessionExpired()
          throw err
        })
        .finally(() => {
          refreshingPromise = null
        })
    }

    const newToken = await refreshingPromise
    res = await doFetch(newToken)
  }

  return res
}

// --- Auth -----------------------------------------------------------------

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
  return res.json() // { token, refreshToken, role }
}

export async function refreshAccessToken(refreshToken) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error("Session expired")
  return res.json() // { token, refreshToken, role }
}

export async function logout(refreshToken) {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
}

// --- Dashboard ---------------------------------------------------------

export async function getDashboard(token) {
  const res = await authorizedFetch(`${API_BASE}/dashboard`, {}, token)
  if (!res.ok) throw new Error("Failed to load dashboard")
  return res.json()
}

// --- Projects ---------------------------------------------------------

export async function getProjects(token, page = 1, pageSize = 20) {
  const res = await authorizedFetch(
    `${API_BASE}/projects?page=${page}&pageSize=${pageSize}`,
    {},
    token
  )
  if (!res.ok) throw new Error("Failed to load projects")
  return res.json()
}

export async function createProject(token, name) {
  const res = await authorizedFetch(
    `${API_BASE}/projects`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to create project")
  }
  return res.json()
}

export async function deleteProject(token, projectId) {
  const res = await authorizedFetch(
    `${API_BASE}/projects/${projectId}`,
    { method: "DELETE" },
    token
  )
  if (!res.ok) throw new Error("Failed to delete project")
}

export async function completeProject(token, projectId) {
  const res = await authorizedFetch(
    `${API_BASE}/projects/${projectId}/complete`,
    { method: "PUT" },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to complete project")
  }
}

export async function reopenProject(token, projectId) {
  const res = await authorizedFetch(
    `${API_BASE}/projects/${projectId}/reopen`,
    { method: "PUT" },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to reopen project")
  }
}

// --- Tasks ------------------------------------------------------------

export async function getTasks(token, projectId, page = 1, pageSize = 10, priority = null, sortBy = null) {
  const params = new URLSearchParams({ page, pageSize })
  if (priority && priority !== "All") {
    params.set("priority", priority)
  }
  if (sortBy) {
    params.set("sortBy", sortBy)
  }
  const res = await authorizedFetch(
    `${API_BASE}/projects/${projectId}/tasks?${params}`,
    {},
    token
  )
  if (!res.ok) throw new Error("Failed to load tasks")
  return res.json()
}

export async function createTask(token, projectId, title, priority = "Medium", dueDate = null) {
  const res = await authorizedFetch(
    `${API_BASE}/projects/${projectId}/tasks`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority, dueDate }),
    },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to create task")
  }
  return res.json()
}

export async function updateTask(token, taskId, title, isDone, priority, dueDate) {
  const res = await authorizedFetch(
    `${API_BASE}/tasks/${taskId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, isDone, priority, dueDate }),
    },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to update task")
  }
}

export async function deleteTask(token, taskId) {
  const res = await authorizedFetch(
    `${API_BASE}/tasks/${taskId}`,
    { method: "DELETE" },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to delete task")
  }
}

// --- Users --------------------------------------------------------------

export async function getUsers(token, page = 1, pageSize = 20) {
  const res = await authorizedFetch(
    `${API_BASE}/users?page=${page}&pageSize=${pageSize}`,
    {},
    token
  )
  if (!res.ok) throw new Error("Failed to load users")
  return res.json()
}

export async function getUserProjects(token, userId) {
  const res = await authorizedFetch(
    `${API_BASE}/users/${userId}/projects`,
    {},
    token
  )
  if (!res.ok) throw new Error("Failed to load user's projects")
  return res.json()
}

export async function updateUserRole(token, userId, role) {
  const res = await authorizedFetch(
    `${API_BASE}/users/${userId}/role`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to update role")
  }
}

export async function updateUser(token, userId, username) {
  const res = await authorizedFetch(
    `${API_BASE}/users/${userId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to update user")
  }
}

export async function deleteUser(token, userId) {
  const res = await authorizedFetch(
    `${API_BASE}/users/${userId}`,
    { method: "DELETE" },
    token
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to delete user")
  }
}