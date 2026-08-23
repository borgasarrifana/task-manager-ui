import { useState } from "react"
import { FolderKanban, ListChecks, LogOut } from "lucide-react"

function NavItem({ icon: Icon, label, active, collapsed, onClick, indent = false }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center py-2 transition"
        style={{
          paddingLeft: collapsed ? '8px' : (indent ? '28px' : '8px'),
          justifyContent: 'flex-start',
        }}
      >
        {collapsed ? (
          <Icon
            size={16}
            style={{ color: active ? '#00e5ff' : 'rgba(234,252,255,0.5)', flexShrink: 0 }}
          />
        ) : (
          <span
            className="text-sm"
            style={{
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: active ? '#00e5ff' : 'rgba(234,252,255,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        )}
      </button>

      {collapsed && hovered && (
        <div
          className="hud-panel"
          style={{
            position: 'absolute',
            left: '56px',
            top: '4px',
            padding: '4px 10px',
            whiteSpace: 'nowrap',
            zIndex: 50,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#00e5ff',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

function Sidebar({ username, onLogout, selectedProject, onGoHome }) {
  const [collapsed, setCollapsed] = useState(false)
  const onTasksPage = !!selectedProject

  return (
    <div
      className="hud-panel flex flex-col justify-between p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: collapsed ? '64px' : '240px',
        height: '100vh',
        zIndex: 40,
        transition: 'width 0.25s ease',
        overflow: 'visible',
      }}
    >
      {/* Collapse toggle — tab attached to right edge */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '-23px',
          width: '22px',
          height: '36px',
          background: '#0a1620',
          borderTop: '1px solid #00e5ff',
          borderRight: '1px solid #00e5ff',
          borderBottom: '1px solid #00e5ff',
          borderLeft: 'none',
          borderRadius: '0 4px 4px 0',
          color: '#00e5ff',
          fontFamily: 'var(--font-mono)',
          fontSize: '1rem',
          zIndex: 41,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      <div className="flex-1 overflow-y-auto" style={{ overflowX: 'hidden' }}>
        <div className="flex items-center gap-2 mb-6" style={{ paddingLeft: '8px' }}>
          <span className="hud-status-dot"></span>
          <span
            className="hud-label"
            style={{ whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s' }}
          >
            Online
          </span>
        </div>

        <h1
          className="hud-title text-xl mb-8"
          style={{ lineHeight: 1.3, whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s' }}
        >
          TASK<br />MANAGER
        </h1>

        <div
          className="hud-label mb-3"
          style={{ letterSpacing: '0.15em', whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s' }}
        >
          Navigation
        </div>

        <NavItem
          icon={FolderKanban}
          label="Projects"
          active={true}
          collapsed={collapsed}
          onClick={onGoHome}
        />

        {onTasksPage && (
          <NavItem
            icon={ListChecks}
            label="Tasks"
            active={true}
            collapsed={collapsed}
            onClick={() => {}}
            indent={true}
          />
        )}
      </div>

      <div>
        <div className="mb-4 pt-4" style={{ borderTop: '1px solid rgba(0, 229, 255, 0.15)' }}>
          {!collapsed ? (
            <>
              <div className="hud-label mb-1" style={{ whiteSpace: 'nowrap' }}>Operator</div>
              <div className="hud-title text-sm" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                {username || "Unknown"}
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <span className="hud-status-dot"></span>
            </div>
          )}
        </div>

        {!collapsed ? (
          <button
            onClick={onLogout}
            className="hud-btn hud-btn-danger w-full py-2 text-sm"
          >
            Logout
          </button>
        ) : (
          <div className="relative flex justify-center">
            <button
              onClick={onLogout}
              className="hud-btn hud-btn-danger py-2 w-full flex items-center justify-center"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar