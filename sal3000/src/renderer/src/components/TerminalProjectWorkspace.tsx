import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Archive,
  Files,
  History,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Square,
  TerminalSquare,
  Trash2
} from 'lucide-react'
import type { TerminalSession } from '@shared/types'
import type { ProjectWorkspaceProps } from '../projectTypeRegistry'
import { ChatHistoryPanel } from './ChatHistoryPanel'
import { FilesPanel } from './FilesPanel'
import { HistoryPanel } from './HistoryPanel'
import { ManagedTerminal } from './ManagedTerminal'
import { StatusDot } from './StatusDot'
import { TerminalLauncher } from './TerminalLauncher'

type WorkspaceTab = 'terminal' | 'files' | 'chats' | 'history'

export function TerminalProjectWorkspace({
  project,
  selectedSessionId,
  onSelectSession,
  onChanged
}: ProjectWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>('terminal')
  const [showLauncher, setShowLauncher] = useState(false)
  const [menu, setMenu] = useState<{ sessionId: string; top: number; left: number } | null>(
    null
  )
  const visibleSessions = useMemo(
    () => project.sessions.filter((session) => !session.archived),
    [project.sessions]
  )
  const archivedSessions = useMemo(
    () => project.sessions.filter((session) => session.archived),
    [project.sessions]
  )
  const activeSession =
    visibleSessions.find((session) => session.id === selectedSessionId) ?? visibleSessions[0]

  useEffect(() => {
    if (!activeSession) return
    if (activeSession.id !== selectedSessionId) onSelectSession(activeSession.id)
    void window.projectConsole.terminals.acknowledge(activeSession.id).then(onChanged)
  }, [activeSession?.id])

  useEffect(() => {
    if (!menu) return
    function closeMenu(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.terminal-menu-portal, .tab-menu-button')) setMenu(null)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenu(null)
    }
    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menu])

  async function selectSession(id: string) {
    setTab('terminal')
    onSelectSession(id)
    await window.projectConsole.terminals.acknowledge(id)
    await onChanged()
  }

  async function startTerminal(input: Parameters<typeof window.projectConsole.terminals.start>[0]) {
    const session = await window.projectConsole.terminals.start(input)
    onSelectSession(session.id)
    await onChanged()
  }

  async function rename(session: TerminalSession) {
    setMenu(null)
    const name = window.prompt('Terminal name', session.name)
    if (!name || name.trim() === session.name) return
    await window.projectConsole.terminals.rename(session.id, name)
    await onChanged()
  }

  async function stop(session: TerminalSession) {
    setMenu(null)
    if (!window.confirm(`Stop “${session.name}”? Its saved output will be kept.`)) return
    await window.projectConsole.terminals.stop(session.id)
    await onChanged()
  }

  async function archive(session: TerminalSession) {
    setMenu(null)
    await window.projectConsole.terminals.archive(session.id)
    await onChanged()
  }

  async function restore(session: TerminalSession) {
    await window.projectConsole.terminals.restore(session.id)
    onSelectSession(session.id)
    await onChanged()
  }

  async function permanentlyDelete(session: TerminalSession) {
    if (
      !window.confirm(
        `Permanently delete “${session.name}” and its saved terminal output? Agent conversation archives will not be deleted.`
      )
    )
      return
    await window.projectConsole.terminals.delete(session.id)
    await onChanged()
  }

  return (
    <div className="project-workspace">
      <nav className="workspace-tabs" aria-label="Project tools">
        <button className={tab === 'terminal' ? 'active' : ''} onClick={() => setTab('terminal')}>
          <TerminalSquare size={15} />
          Terminals
        </button>
        <button className={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>
          <Files size={15} />
          Files
        </button>
        <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}>
          <MessageSquareText size={15} />
          LLM Chats
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          <History size={15} />
          Activity
        </button>
      </nav>

      {tab === 'terminal' && (
        <section className="terminal-workspace">
          <div className="terminal-tabs">
            <div className="terminal-tabs-scroll">
              {visibleSessions.map((session) => (
                <div
                  key={session.id}
                  className={`terminal-tab ${activeSession?.id === session.id ? 'active' : ''}`}
                >
                  <button
                    className="terminal-tab-select"
                    onClick={() => void selectSession(session.id)}
                  >
                    <StatusDot state={session.state} compact />
                    <span>{session.name}</span>
                    {session.dangerousMode && <small className="unsafe-badge">unsafe</small>}
                  </button>
                  <button
                    className="tab-menu-button"
                    aria-label={`Actions for ${session.name}`}
                    onClick={(event) => {
                      const bounds = event.currentTarget.getBoundingClientRect()
                      setMenu((current) =>
                        current?.sessionId === session.id
                          ? null
                          : {
                              sessionId: session.id,
                              top: bounds.bottom + 5,
                              left: Math.max(8, bounds.right - 150)
                            }
                      )
                    }}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="new-terminal-button"
              onClick={() => setShowLauncher(true)}
              title="New terminal"
            >
              <Plus size={16} />
            </button>
          </div>

          {activeSession ? (
            <div className="terminal-surface">
              <ManagedTerminal session={activeSession} />
            </div>
          ) : (
            <div className="terminal-empty">
              <div className="empty-orbit">
                <TerminalSquare size={31} />
              </div>
              <span className="eyebrow">READY WHEN YOU ARE</span>
              <h2>Start your first terminal</h2>
              <p>
                Run a shell, Codex, Claude Code, or any custom command in{' '}
                <strong>{project.name}</strong>.
              </p>
              <button className="primary-button" onClick={() => setShowLauncher(true)}>
                <Plus size={16} /> New terminal
              </button>
              {archivedSessions.length > 0 && (
                <div className="archived-list">
                  <span>{archivedSessions.length} archived</span>
                  {archivedSessions.map((session) => (
                    <div key={session.id}>
                      <span>{session.name}</span>
                      <button onClick={() => void restore(session)}>
                        <RotateCcw size={13} /> Restore
                      </button>
                      <button className="danger-text" onClick={() => void permanentlyDelete(session)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {tab === 'files' && <FilesPanel project={project} />}
      {tab === 'chats' && <ChatHistoryPanel project={project} />}
      {tab === 'history' && <HistoryPanel project={project} />}
      {menu &&
        createPortal(
          <div
            className="popover-menu terminal-menu-portal"
            style={{ top: menu.top, left: menu.left }}
          >
            {(() => {
              const session = visibleSessions.find((item) => item.id === menu.sessionId)
              if (!session) return null
              return (
                <>
                  <button onClick={() => void rename(session)}>
                    <Pencil size={14} /> Rename
                  </button>
                  {!['completed', 'error'].includes(session.state) ? (
                    <button className="danger-text" onClick={() => void stop(session)}>
                      <Square size={13} /> Stop
                    </button>
                  ) : (
                    <>
                      <button onClick={() => void archive(session)}>
                        <Archive size={14} /> Archive
                      </button>
                      <button
                        className="danger-text"
                        onClick={() => void permanentlyDelete(session)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  )}
                </>
              )
            })()}
          </div>,
          document.body
        )}
      {showLauncher && (
        <TerminalLauncher
          projectId={project.id}
          onClose={() => setShowLauncher(false)}
          onStart={startTerminal}
        />
      )}
    </div>
  )
}
