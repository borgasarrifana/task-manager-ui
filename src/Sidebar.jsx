import { useState } from "react"
import { FolderKanban, ListChecks, LogOut, Sun, Moon, ChevronDown, Users as UsersIcon } from "lucide-react"
import { useTheme } from "./hooks/useTheme"

function CollapsedTooltip({ label, color = 'var(--color-cyan)' }) {
  return (
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
        color,
        '--panel-accent': color,
      }}
    >
      {label}
    </div>
  )
}

function NavItem({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
  indent = false,
  hasArrow = false,
  expanded = false,
  onToggleExpand,
  attachedTop = false,
  attachedBottom = false,
}) {
  const [hovered, setHovered] = useState(false)

  // Collapsed sidebar: icon-only, boxed with the same bordered
  // container as the light/dark mode toggle, plus a hover tooltip for the label
  if (collapsed) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          onClick={onClick}
          className="hud-btn w-full flex items-center justify-center py-2"
          style={{
            marginBottom: attachedBottom ? 0 : '8px',
            borderTop: attachedTop ? 'none' : undefined,
            borderBottom: attachedBottom ? 'none' : undefined,
          }}
        >
          <Icon size={16} style={{ flexShrink: 0 }} />
        </button>

        {hovered && <CollapsedTooltip label={label} />}
      </div>
    )
  }

  // Expanded sidebar: bordered hud-btn look, text-only (no icon)
  return (
    <button
      onClick={onClick}
      className="hud-btn w-full flex items-center gap-2 py-2 text-sm"
      style={{
        justifyContent: 'flex-start',
        paddingLeft: indent ? '28px' : '10px',
        paddingRight: '10px',
        marginBottom: attachedBottom ? 0 : '8px',
        borderTop: attachedTop ? 'none' : undefined,
        borderBottom: attachedBottom ? 'none' : undefined,
      }}
    >
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>

      {hasArrow && (
        <span
          role="button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand && onToggleExpand()
          }}
          style={{ display: 'flex', alignItems: 'center', padding: '2px' }}
        >
          <ChevronDown
            size={14}
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
            }}
          />
        </span>
      )}
    </button>
  )
}

function Sidebar({ username, role, onLogout, selectedProject, onGoHome, showUsers, onShowUsers }) {
  const [collapsed, setCollapsed] = useState(false)
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(true)
  const [themeHovered, setThemeHovered] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)
  const [operatorHovered, setOperatorHovered] = useState(false)
  const onTasksPage = !!selectedProject
  const showTasks = onTasksPage && projectsMenuOpen
  const isAdmin = role === 'Admin'
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

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
          background: 'var(--color-panel)',
          borderTop: '1px solid var(--color-cyan)',
          borderRight: '1px solid var(--color-cyan)',
          borderBottom: '1px solid var(--color-cyan)',
          borderLeft: 'none',
          borderRadius: '0 4px 4px 0',
          color: 'var(--color-cyan)',
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

      <div
        className="flex-1"
        style={{
          overflowY: collapsed ? 'visible' : 'auto',
          overflowX: collapsed ? 'visible' : 'hidden',
        }}
      >
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
          active={!showUsers}
          collapsed={collapsed}
          onClick={onGoHome}
          hasArrow={onTasksPage}
          expanded={projectsMenuOpen}
          onToggleExpand={() => setProjectsMenuOpen((o) => !o)}
          attachedBottom={showTasks}
        />

        {showTasks && (
          <NavItem
            icon={ListChecks}
            label="Tasks"
            active={!showUsers}
            collapsed={collapsed}
            onClick={() => {}}
            indent={true}
            attachedTop={true}
          />
        )}

        {isAdmin && (
          <NavItem
            icon={UsersIcon}
            label="Users"
            active={showUsers}
            collapsed={collapsed}
            onClick={onShowUsers}
          />
        )}
      </div>

      <div>
        <div
          className="mb-4 pt-4 flex items-center justify-between"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--color-cyan) 15%, transparent)' }}
        >
          {!collapsed ? (
            <>
              <div>
                <div className="hud-label mb-1" style={{ whiteSpace: 'nowrap' }}>Operator</div>
                <div className="hud-title text-sm" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {username || "Unknown"}
                </div>
              </div>

              {isAdmin && (
                <span
                  className="hud-label"
                  style={{ color: 'var(--color-amber)', whiteSpace: 'nowrap' }}
                >
                  Admin
                </span>
              )}
            </>
          ) : (
            <div
              className="relative flex justify-center w-full"
              onMouseEnter={() => setOperatorHovered(true)}
              onMouseLeave={() => setOperatorHovered(false)}
            >
              <span className="hud-status-dot"></span>
              {operatorHovered && (
                <CollapsedTooltip
                  label={isAdmin ? `${username || 'Unknown'} (Admin)` : (username || 'Unknown')}
                  color={isAdmin ? 'var(--color-amber)' : 'var(--color-cyan)'}
                />
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        {!collapsed ? (
          <button
            onClick={toggleTheme}
            className="hud-btn w-full py-2 text-sm mb-2 flex items-center justify-center gap-2"
          >
            {isLight ? <Moon size={14} /> : <Sun size={14} />}
            {isLight ? 'Dark Mode' : 'Light Mode'}
          </button>
        ) : (
          <div
            className="relative flex justify-center mb-2"
            onMouseEnter={() => setThemeHovered(true)}
            onMouseLeave={() => setThemeHovered(false)}
          >
            <button
              onClick={toggleTheme}
              className="hud-btn py-2 w-full flex items-center justify-center"
            >
              {isLight ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {themeHovered && (
              <CollapsedTooltip label={isLight ? 'Switch to Dark' : 'Switch to Light'} />
            )}
          </div>
        )}

        {!collapsed ? (
          <button
            onClick={onLogout}
            className="hud-btn hud-btn-danger w-full py-2 text-sm"
          >
            Logout
          </button>
        ) : (
          <div
            className="relative flex justify-center"
            onMouseEnter={() => setLogoutHovered(true)}
            onMouseLeave={() => setLogoutHovered(false)}
          >
            <button
              onClick={onLogout}
              className="hud-btn hud-btn-danger py-2 w-full flex items-center justify-center"
            >
              <LogOut size={16} />
            </button>
            {logoutHovered && (
              <CollapsedTooltip label="Logout" color="var(--color-amber)" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
