import { useState } from "react"
import HudFrame from "./HudFrame"

function Tooltip({
  label,
  children,
  position = "top",
  color = "var(--color-cyan)",
  wrap = false,
  variant = "panel", // "panel" (corner-bracket style) | "frame" (clipped-corner HUD frame)
}) {
  const [hovered, setHovered] = useState(false)

  const positionStyles = {
    top: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  }

  const textStyles = {
    whiteSpace: wrap ? "normal" : "nowrap",
    width: wrap ? "160px" : undefined,
    lineHeight: wrap ? 1.4 : undefined,
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color,
  }

  const renderTooltip = () => {
    if (variant === "frame") {
      return (
        <HudFrame
          role="tooltip"
          accent={color}
          style={{
            position: "absolute",
            zIndex: 50,
            pointerEvents: "none",
            ...positionStyles[position],
          }}
          bodyStyle={{ padding: "7px 16px", textAlign: "center", ...textStyles }}
        >
          {label}
        </HudFrame>
      )
    }

    return (
      <div
        className="hud-panel"
        role="tooltip"
        style={{
          position: "absolute",
          padding: "6px 10px",
          zIndex: 50,
          "--panel-accent": color,
          ...textStyles,
          ...positionStyles[position],
        }}
      >
        {label}
      </div>
    )
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && renderTooltip()}
    </div>
  )
}

export default Tooltip