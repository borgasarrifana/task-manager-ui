export default function TickFrame({ as: Tag = 'button', className = '', children, ...props }) {
  return (
    <Tag className={`hud-btn-svgframe ${className}`} {...props}>
      <svg className="hud-svgframe-border" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
        <polygon points="12,1 108,1 122,10 122,30 108,39 12,39 -2,30 -2,10" />
      </svg>
      {['corner-tl', 'corner-tr', 'corner-bl', 'corner-br', 'top-tl', 'top-tr', 'top-bl', 'top-br', 'left', 'right'].map(pos => (
        <span key={pos} className={`hud-tick ${pos}`} />
      ))}
      <span className="hud-svgframe-label">{children}</span>
    </Tag>
  );
}