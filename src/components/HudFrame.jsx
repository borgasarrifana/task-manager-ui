function HudFrame({
  children,
  accent = "var(--color-cyan)",
  size = "sm", // "sm" (tooltips, badges) | "lg" (modals, panels)
  className = "",
  style,
  bodyClassName = "",
  bodyStyle,
  ...rest
}) {
  return (
    <div
      className={`hud-frame ${size === "lg" ? "hud-frame--lg" : ""} ${className}`}
      style={{ "--frame-accent": accent, ...style }}
      {...rest}
    >
      <div className="hud-frame-bg" aria-hidden="true">
        <div className="hud-frame-border">
          <div className="hud-frame-fill" />
        </div>
      </div>
      <span className="hud-frame-tab" aria-hidden="true" />
      <div className={`hud-frame-content ${bodyClassName}`} style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}

export default HudFrame