import type { ReactNode } from 'react'
import type { Notif } from '../ctx'
import { Logo } from './Logo'

function ago(at: Date, now = new Date()): string {
  const s = Math.round((now.getTime() - at.getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function NotifCard({ n, onOpen, actions }: { n: Notif; onOpen?: () => void; actions?: ReactNode }) {
  return (
    <div className="notif" onClick={onOpen}>
      <div className="notif-icon">
        <Logo size={38} />
      </div>
      <div className="notif-main">
        <div className="notif-meta">
          {n.timeSensitive && <span className="ts">TIME SENSITIVE</span>}
          <span className="muted">{ago(n.at)}</span>
        </div>
        <b>{n.title}</b>
        <p>{n.body}</p>
        {actions && (
          <div className="notif-actions" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
