import { useState, useRef, useEffect } from "react"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function HudDatePicker({ value, onChange, placeholder = "SELECT DATE" }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const selected = value ? new Date(value + "T00:00:00") : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells = []
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function selectDay(day) {
    const picked = new Date(year, month, day)
    onChange(toDateString(picked))
    setOpen(false)
  }

  function changeMonth(delta) {
    setViewDate(new Date(year, month + delta, 1))
  }

  function isSameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="hud-input px-3 py-2 w-full text-left flex items-center justify-between"
      >
        <span style={{ color: value ? undefined : 'rgba(10,143,168,0.7)' }}>
          {value ? new Date(value + "T00:00:00").toLocaleDateString() : placeholder}
        </span>
        <span style={{ color: '#00e5ff' }}>▾</span>
      </button>

      {open && (
        <div
          className="hud-panel p-4"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '260px',
            background: '#0a1620',
            zIndex: 100,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="hud-label px-2"
              style={{ color: '#00e5ff', fontSize: '1rem' }}
            >
              ‹
            </button>
            <span className="hud-title text-sm">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="hud-label px-2"
              style={{ color: '#00e5ff', fontSize: '1rem' }}
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="hud-label text-center" style={{ fontSize: '0.65rem' }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`}></div>

              const cellDate = new Date(year, month, day)
              const isSelected = isSameDay(cellDate, selected)
              const isToday = isSameDay(cellDate, today)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className="text-center py-1 text-xs transition"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background: isSelected ? '#00e5ff' : isToday ? 'rgba(0,229,255,0.15)' : 'transparent',
                    color: isSelected ? '#030b0f' : isToday ? '#00e5ff' : '#eafcff',
                    border: isToday && !isSelected ? '1px solid #00e5ff' : '1px solid transparent',
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              className="hud-label w-full text-center mt-3 pt-2"
              style={{ color: '#ffb020', borderTop: '1px solid rgba(0,229,255,0.15)' }}
            >
              Clear Date
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default HudDatePicker