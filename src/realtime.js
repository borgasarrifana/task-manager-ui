import * as signalR from "@microsoft/signalr"
import { API_BASE } from "./api"

// ".../api" -> ".../hubs/tasks"
const HUB_URL = API_BASE.replace(/\/api\/?$/, "") + "/hubs/tasks"
const RESTART_DELAY_MS = 15000

let connection = null
let stopped = true
let hasConnected = false
let restartTimer = null
let status = "offline" // "connecting" | "online" | "reconnecting" | "offline"

const statusListeners = new Set()
const eventHandlers = {
  TaskChanged: new Set(),
  ProjectChanged: new Set(),
  Resync: new Set(), // fired after a reconnect: refetch anything that may have been missed
}
const projectRefs = new Map() // projectId -> number of components watching it

// --- Status (consumed via useSyncExternalStore) ------------------------------

function setStatus(next) {
  if (status === next) return
  status = next
  statusListeners.forEach((listener) => listener())
}

export const getRealtimeStatus = () => status

export function subscribeRealtimeStatus(listener) {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

// --- Events ------------------------------------------------------------------

function emit(event, payload) {
  eventHandlers[event]?.forEach((handler) => {
    try {
      handler(payload)
    } catch (err) {
      console.error(`Realtime handler for ${event} failed`, err)
    }
  })
}

export function onRealtime(event, handler) {
  eventHandlers[event].add(handler)
  return () => eventHandlers[event].delete(handler)
}

// --- Project groups ----------------------------------------------------------

const isConnected = () => connection?.state === signalR.HubConnectionState.Connected

async function joinAllProjects() {
  for (const projectId of projectRefs.keys()) {
    try {
      await connection.invoke("JoinProject", projectId)
    } catch (err) {
      console.warn(`Could not join project ${projectId}`, err)
    }
  }
}

export function joinProject(projectId) {
  const count = projectRefs.get(projectId) || 0
  projectRefs.set(projectId, count + 1)
  if (count === 0 && isConnected()) {
    connection.invoke("JoinProject", projectId).catch((err) =>
      console.warn(`Could not join project ${projectId}`, err)
    )
  }
  // If not connected yet, joinAllProjects() picks it up once the connection starts
}

export function leaveProject(projectId) {
  const count = projectRefs.get(projectId) || 0
  if (count === 0) return
  if (count > 1) {
    projectRefs.set(projectId, count - 1)
    return
  }
  projectRefs.delete(projectId)
  if (isConnected()) {
    connection.invoke("LeaveProject", projectId).catch(() => {})
  }
}

// --- Connection lifecycle ----------------------------------------------------

function scheduleRestart() {
  if (stopped) return
  clearTimeout(restartTimer)
  restartTimer = setTimeout(connect, RESTART_DELAY_MS)
}

function buildConnection() {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      // Read on every (re)connect, so refreshed tokens are picked up automatically
      accessTokenFactory: () => localStorage.getItem("token") || "",
      withCredentials: false, // JWT auth, no cookies — keeps CORS simple
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  conn.on("TaskChanged", (e) => emit("TaskChanged", e))
  conn.on("ProjectChanged", (e) => emit("ProjectChanged", e))

  conn.onreconnecting(() => setStatus("reconnecting"))
  conn.onreconnected(async () => {
    setStatus("online")
    await joinAllProjects() // groups belong to the old connection id
    emit("Resync")
  })
  // Automatic reconnect gave up (e.g. server asleep) — keep retrying slowly
  conn.onclose(() => {
    setStatus("offline")
    scheduleRestart()
  })

  return conn
}

async function connect() {
  if (stopped || !connection) return
  setStatus("connecting")
  try {
    await connection.start()
    setStatus("online")
    await joinAllProjects()
    if (hasConnected) emit("Resync")
    hasConnected = true
  } catch (err) {
    console.warn("Realtime connection failed, retrying", err)
    setStatus("offline")
    scheduleRestart()
  }
}

export function startRealtime() {
  if (!stopped) return
  stopped = false
  hasConnected = false
  connection = buildConnection()
  connect()
}

export function stopRealtime() {
  stopped = true
  clearTimeout(restartTimer)
  projectRefs.clear()
  const conn = connection
  connection = null
  setStatus("offline")
  conn?.stop().catch(() => {})
}