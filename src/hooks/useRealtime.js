import { useEffect, useRef, useCallback, useSyncExternalStore } from "react"
import {
  onRealtime,
  joinProject,
  leaveProject,
  subscribeRealtimeStatus,
  getRealtimeStatus,
} from "../realtime"

export function useRealtimeStatus() {
  return useSyncExternalStore(subscribeRealtimeStatus, getRealtimeStatus)
}

// Subscribes for the component's lifetime; always calls the latest handler,
// so it sees current state (page, filters, etc.) without re-subscribing
export function useRealtimeEvent(event, handler) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })
  useEffect(() => onRealtime(event, (payload) => handlerRef.current(payload)), [event])
}

// Joins the project's group while the component is mounted
export function useProjectChannel(projectId) {
  useEffect(() => {
    if (projectId == null) return
    joinProject(projectId)
    return () => leaveProject(projectId)
  }, [projectId])
}

// Collapses bursts of events (duplicates, rapid edits) into a single call
export function useDebouncedCallback(fn, delay = 300) {
  const fnRef = useRef(fn)
  const timerRef = useRef(null)

  useEffect(() => {
    fnRef.current = fn
  })
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return useCallback(
    (...args) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fnRef.current(...args), delay)
    },
    [delay]
  )
}