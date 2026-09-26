import { useState, useEffect } from "react"
import {
  RefreshCw, AlertTriangle, FolderKanban, ListTodo, CalendarClock,
  SignalLow, SignalMedium, SignalHigh,
} from "lucide-react"
import { getDashboard } from "../api"
import { useRealtimeEvent, useDebouncedCallback } from "../hooks/useRealtime"

const PRIORITY_META = {
  High: { color: "#ffb020", icon: SignalHigh },
  Medium: { color: "#00e5ff", icon: SignalMedium },
  Low: { color: "#0a8fa8", icon: SignalLow },
}

const DAY_MS = 24 * 60 * 60 * 1000

// Due dates are stored as UTC midnight, so compare in UTC to match the server
function daysFromToday(isoDate) {
  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((Date.parse(isoDate) - todayUtc) / DAY_MS)
}

function relativeDue(isoDate, isOverdue) {
  const days = daysFromToday(isoDate)
  if (isOverdue) return `${Math.abs(days)}d overdue`
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `In ${days}d`
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
}

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="hud-status-dot"></span>
      <span className="hud-label">{children}</span>
    </div>
  )
}

function CompletionRing({ percent, done, total }) {
  const r = 70
  const circumference = 2 * Math.PI * r
  // Start empty and animate up to the real value after the first paint
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(percent))
    return () => cancelAnimationFrame(id)
  }, [percent])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 180 180"
        className="w-40 h-40 md:w-44 md:h-44"
        role="img"
        aria-label={`${percent}% of tasks complete`}
      >
        {/* slow-spinning outer reactor ring */}
        <circle
          cx="90" cy="90" r="84"
          fill="none"
          stroke="var(--color-cyan-dim)"
          strokeWidth="1"
          strokeDasharray="2 6"
          opacity="0.7"
          className="animate-[ring-spin_24s_linear_infinite] motion-reduce:animate-none"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        {/* track */}
        <circle
          cx="90" cy="90" r={r}
          fill="none"
          stroke="color-mix(in srgb, var(--color-cyan) 12%, transparent)"
          strokeWidth="10"
        />
        {/* progress arc */}
        <circle
          cx="90" cy="90" r={r}
          fill="none"
          stroke="var(--color-cyan)"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          transform="rotate(-90 90 90)"
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
          style={{ filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--color-cyan) 60%, transparent))" }}
        />
        {/* inner hairline */}
        <circle
          cx="90" cy="90" r="58"
          fill="none"
          stroke="color-mix(in srgb, var(--color-cyan) 25%, transparent)"
          strokeWidth="1"
        />
        <text
          x="90" y="92"
          textAnchor="middle"
          fill="var(--color-cyan)"
          style={{ fontFamily: "var(--font-display)", fontSize: "30px" }}
        >
          {percent}%
        </text>
        <text
          x="90" y="114"
          textAnchor="middle"
          fill="var(--color-cyan-dim)"
          style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.2em" }}
        >
          COMPLETE
        </text>
      </svg>
      <span className="hud-label">
        {done} / {total} tasks done
      </span>
    </div>
  )
}

function StatTile({ label, value, accent, icon: Icon }) {
  return (
    <div
      className="hud-panel p-3 md:p-4 flex flex-col"
      style={{ "--panel-accent": accent }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="hud-label">{label}</span>
        {Icon && <Icon size={14} style={{ color: accent, flexShrink: 0 }} aria-hidden="true" />}
      </div>
      <span
        className="text-3xl md:text-4xl mt-2"
        style={{
          fontFamily: "var(--font-display)",
          color: accent,
          textShadow: `0 0 10px color-mix(in srgb, ${accent} 50%, transparent)`,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function DashboardPage({ token, role, onOpenProject, onShowProjects }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const isAdmin = role === "Admin"

  useEffect(() => {
    loadDashboard()
  }, [])

    // --- Realtime --- (the refresh icon spins briefly as a "live update" cue)
  const refreshDashboard = useDebouncedCallback(() => loadDashboard())
  useRealtimeEvent("TaskChanged", refreshDashboard)
  useRealtimeEvent("ProjectChanged", refreshDashboard)
  useRealtimeEvent("Resync", refreshDashboard)

  async function loadDashboard() {
    try {
      setLoading(true)
      setError("")
      setData(await getDashboard(token))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const rowStyle = {
    border: "1px solid color-mix(in srgb, var(--color-cyan) 20%, transparent)",
  }
  const rowClass =
    "w-full text-left p-3 transition hover:bg-[color-mix(in_srgb,var(--color-cyan)_8%,transparent)]"

  return (
    <div className="min-h-screen relative p-4 md:p-8">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="hud-status-dot"></span>
              <span className="hud-label">
                {isAdmin ? "Mission Overview · All Operators" : "Mission Overview"}
              </span>
            </div>
            <h1 className="hud-title text-2xl md:text-3xl">Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="hud-btn p-2 flex items-center justify-center"
            aria-label="Refresh dashboard"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          </button>
        </div>

        {error && (
          <p
            className="hud-label px-3 py-2 mb-4 border"
            style={{ color: "#ffb020", borderColor: "rgba(255,176,32,0.4)", background: "rgba(255,176,32,0.1)" }}
          >
            ⚠ {error}
          </p>
        )}

        {!data ? (
          loading && <p className="hud-label">Scanning...</p>
        ) : (
          <>
            {/* Ring + stat tiles */}
            <div className="grid gap-4 md:grid-cols-[auto_1fr] mb-4">
              <div className="hud-panel p-6 flex items-center justify-center">
                <CompletionRing
                  percent={data.totals.completionPercent}
                  done={data.totals.doneTasks}
                  total={data.totals.totalTasks}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatTile
                  label="Active Projects"
                  value={data.totals.activeProjects}
                  accent="var(--color-cyan)"
                  icon={FolderKanban}
                />
                <StatTile
                  label="Open Tasks"
                  value={data.totals.openTasks}
                  accent="var(--color-cyan)"
                  icon={ListTodo}
                />
                <StatTile
                  label="Overdue"
                  value={data.totals.overdueTasks}
                  accent={data.totals.overdueTasks > 0 ? "var(--color-amber)" : "var(--color-cyan-dim)"}
                  icon={AlertTriangle}
                />
                <StatTile
                  label="Due This Week"
                  value={data.totals.dueThisWeek}
                  accent="var(--color-green)"
                  icon={CalendarClock}
                />
              </div>
            </div>

            {/* Priority breakdown */}
            <div className="hud-panel p-4 md:p-5 mb-4">
              <SectionHeader>Open Tasks by Priority</SectionHeader>
              <div className="flex flex-col gap-3">
                {["High", "Medium", "Low"].map((level) => {
                  const { color, icon: Icon } = PRIORITY_META[level]
                  const count = data.openByPriority[level.toLowerCase()]
                  const pct = data.totals.openTasks ? (count / data.totals.openTasks) * 100 : 0
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-24 shrink-0" style={{ color }}>
                        <Icon size={16} aria-hidden="true" />
                        <span className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>{level}</span>
                      </div>
                      <div
                        className="flex-1 h-2"
                        style={{ background: "color-mix(in srgb, var(--color-cyan) 8%, transparent)" }}
                      >
                        <div
                          className="h-full"
                          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
                        />
                      </div>
                      <span className="w-8 text-right" style={{ fontFamily: "var(--font-mono)", color }}>
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Project progress */}
              <div className="hud-panel p-4 md:p-5">
                <SectionHeader>Project Progress</SectionHeader>
                {data.projects.length === 0 ? (
                  <p className="hud-label">No active projects.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {data.projects.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => onOpenProject({
                            id: p.id,
                            name: p.name,
                            ownerUsername: p.ownerUsername,
                            isCompleted: false,
                          })}
                          className={rowClass}
                          style={rowStyle}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="hud-title text-sm min-w-0" style={{ overflowWrap: "anywhere" }}>
                              {p.name}
                            </span>
                            <span className="shrink-0 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-cyan)" }}>
                              {p.doneTasks}/{p.totalTasks}
                            </span>
                          </div>
                          {isAdmin && p.ownerUsername && (
                            <div className="hud-label mt-1">Owner: {p.ownerUsername}</div>
                          )}
                          <div
                            className="h-1 mt-2"
                            style={{ background: "color-mix(in srgb, var(--color-cyan) 10%, transparent)" }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${p.completionPercent}%`,
                                background: "var(--color-cyan)",
                                boxShadow: "0 0 6px var(--color-cyan)",
                              }}
                            />
                          </div>
                          {p.overdueTasks > 0 && (
                            <div className="hud-label mt-2" style={{ color: "var(--color-amber)" }}>
                              ⚠ {p.overdueTasks} overdue
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {data.totals.activeProjects > data.projects.length && (
                  <button
                    type="button"
                    onClick={onShowProjects}
                    className="hud-label mt-3"
                    style={{ color: "var(--color-cyan)" }}
                  >
                    View all {data.totals.activeProjects} projects →
                  </button>
                )}
              </div>

              {/* Upcoming deadlines */}
              <div className="hud-panel p-4 md:p-5">
                <SectionHeader>Upcoming Deadlines</SectionHeader>
                {data.upcoming.length === 0 ? (
                  <p className="hud-label">No upcoming deadlines.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {data.upcoming.map((t) => {
                      const meta = PRIORITY_META[t.priority] || PRIORITY_META.Medium
                      const PriorityIcon = meta.icon
                      const dateColor = t.isOverdue ? "var(--color-amber)" : "var(--color-cyan)"
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => onOpenProject({
                              id: t.projectId,
                              name: t.projectName,
                              isCompleted: false,
                            })}
                            className={`${rowClass} flex items-start gap-3`}
                            style={rowStyle}
                          >
                            <PriorityIcon
                              size={16}
                              className="shrink-0 mt-0.5"
                              style={{ color: meta.color }}
                              aria-label={`${t.priority} priority`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm" style={{ fontFamily: "var(--font-mono)", overflowWrap: "anywhere" }}>
                                {t.title}
                              </div>
                              <div className="hud-label mt-1 truncate">{t.projectName}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: dateColor }}>
                                {formatDate(t.dueDate)}
                              </div>
                              <div className="hud-label mt-1" style={{ color: dateColor }}>
                                {relativeDue(t.dueDate, t.isOverdue)}
                              </div>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage