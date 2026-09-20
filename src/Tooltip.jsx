import { useState } from "react"

function Tooltip({ label, children, position = "top", color = "var(--color-cyan)", wrap = false }) {
  const [hovered, setHovered] = useState(false)

  const positionStyles = {
    top: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <div
          className="hud-panel"
          style={{
            position: "absolute",
            padding: "6px 10px",
            whiteSpace: wrap ? "normal" : "nowrap",
            width: wrap ? "160px" : undefined,
            lineHeight: wrap ? 1.4 : undefined,
            zIndex: 50,
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color,
            "--panel-accent": color,
            ...positionStyles[position],
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

export default Tooltip