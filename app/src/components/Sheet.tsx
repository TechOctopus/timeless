import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../ctx'
import { AVATAR_COLORS, AVATAR_EMOJIS, CITIES, cityById, userById } from '../data'
import { clock, dateLine, diffLabel, localHour, offsetLabel, offsetMinutes, relativeDay, vibe } from '../lib/time'
import { cityOf, type Settings } from '../store'
import { Avatar } from './Avatar'
import { UserSearch } from './UserSearch'

export type SheetView = { kind: 'list' } | { kind: 'friend'; id: string } | { kind: 'add' } | { kind: 'profile' } | { kind: 'settings' }

type Props = {
  view: SheetView
  setView: (v: SheetView) => void
  /** Reports the visible sheet height so the map can keep pins out from under it. */
  onHeight: (h: number) => void
}

export function Sheet({ view, setView, onHeight }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [parentH, setParentH] = useState(800)
  const [snap, setSnap] = useState(1)
  const [drag, setDrag] = useState<number | null>(null)
  const start = useRef({ y: 0, h: 0, t: 0 })

  const snaps = [150, Math.round(parentH * 0.46), parentH - 64]
  const height = drag ?? snaps[snap]

  useEffect(() => {
    const parent = ref.current?.parentElement
    if (!parent) return
    const ro = new ResizeObserver(() => setParentH(parent.clientHeight))
    ro.observe(parent)
    return () => ro.disconnect()
  }, [])

  useEffect(() => onHeight(height), [height, onHeight])

  // Opening a detail view from the peek state should reveal it.
  useEffect(() => {
    if (view.kind !== 'list') setSnap((s) => Math.max(s, 1))
  }, [view])

  const down = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    start.current = { y: e.clientY, h: height, t: performance.now() }
    setDrag(height)
  }
  const move = (e: React.PointerEvent) => {
    if (drag === null) return
    const h = start.current.h - (e.clientY - start.current.y)
    setDrag(Math.max(snaps[0] - 40, Math.min(snaps[2] + 20, h)))
  }
  const up = (e: React.PointerEvent) => {
    if (drag === null) return
    const dy = e.clientY - start.current.y
    const v = dy / Math.max(1, performance.now() - start.current.t)
    let target: number
    if (Math.abs(dy) < 5) target = snap === 0 ? 1 : snap // tap on handle
    else if (v < -0.5) target = Math.min(2, snap + 1)
    else if (v > 0.5) target = Math.max(0, snap - 1)
    else target = snaps.reduce((best, s, i) => (Math.abs(s - drag) < Math.abs(snaps[best] - drag) ? i : best), 0)
    setSnap(target)
    setDrag(null)
  }

  return (
    <div ref={ref} className={`sheet ${drag !== null ? 'dragging' : ''}`} style={{ height }}>
      <div className="sheet-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <span className="grabber" />
        <SheetHeader view={view} setView={setView} />
      </div>
      <div className="sheet-body">
        {view.kind === 'list' && <FriendList onOpen={(id) => setView({ kind: 'friend', id })} onAdd={() => setView({ kind: 'add' })} />}
        {view.kind === 'friend' && <FriendDetail id={view.id} onClose={() => setView({ kind: 'list' })} />}
        {view.kind === 'add' && <UserSearch />}
        {view.kind === 'profile' && <ProfileView />}
        {view.kind === 'settings' && <SettingsView />}
      </div>
    </div>
  )
}

function SheetHeader({ view, setView }: { view: SheetView; setView: (v: SheetView) => void }) {
  const { state, focusUser } = useApp()
  const p = state.profile!
  const back = () => {
    focusUser(null)
    setView({ kind: 'list' })
  }
  const title =
    view.kind === 'list'
      ? 'Friends'
      : view.kind === 'friend'
        ? userById(view.id).name.split(' ')[0]
        : view.kind === 'add'
          ? 'Add friends'
          : view.kind === 'profile'
            ? 'Your profile'
            : 'Settings'
  return (
    <div className="sheet-head" onPointerDown={(e) => (e.target as HTMLElement).closest('button') && e.stopPropagation()}>
      {view.kind === 'list' ? (
        <h2>{title}</h2>
      ) : (
        <button className="back" onClick={back}>
          ‹ <span>{title}</span>
        </button>
      )}
      <div className="head-icons">
        <button className={`icon-btn ${view.kind === 'add' ? 'on' : ''}`} onClick={() => setView({ kind: 'add' })} aria-label="Add friends">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6" />
          </svg>
          {state.requests.length > 0 && <i className="dot" />}
        </button>
        <button className={`icon-btn ${view.kind === 'settings' ? 'on' : ''}`} onClick={() => setView({ kind: 'settings' })} aria-label="Settings">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
        <button className="icon-btn avatar-btn" onClick={() => setView({ kind: 'profile' })} aria-label="Your profile">
          <Avatar emoji={p.emoji} color={p.color} size={30} />
        </button>
      </div>
    </div>
  )
}

function FriendList({ onOpen, onAdd }: { onOpen: (id: string) => void; onAdd: () => void }) {
  const { state, now, focusUser, acceptRequest, declineRequest } = useApp()
  const myTz = cityById(state.me).tz
  const myOff = offsetMinutes(myTz, now)
  const [q, setQ] = useState('')

  const rows = state.friends
    .map((id) => {
      const u = userById(id)
      const city = cityById(cityOf(state, id, u.home))
      return { u, city, off: offsetMinutes(city.tz, now) }
    })
    .filter(({ u, city }) => !q || (u.name + u.username + city.name).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.off - b.off)

  return (
    <>
      {state.requests.map((id) => {
        const u = userById(id)
        return (
          <div key={id} className="request">
            <Avatar emoji={u.emoji} color={u.color} size={38} />
            <div className="user-row-main">
              <b>@{u.username}</b>
              <span className="muted">wants to be your friend</span>
            </div>
            <button className="chip" onClick={() => acceptRequest(id)}>
              Add
            </button>
            <button className="chip chip-ghost" onClick={() => declineRequest(id)}>
              ✕
            </button>
          </div>
        )
      })}

      {state.friends.length > 3 && (
        <div className="search small">
          <span>🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search friends" />
        </div>
      )}

      {rows.map(({ u, city, off }) => {
        const travelling = city.id !== u.home
        const rel = relativeDay(city.tz, myTz, now)
        return (
          <button
            key={u.id}
            className="friend-row"
            onClick={() => {
              focusUser(u.id)
              onOpen(u.id)
            }}
          >
            <Avatar emoji={u.emoji} color={u.color} size={42} badge={travelling ? '✈️' : undefined} />
            <div className="friend-main">
              <b>{u.name}</b>
              <span className="muted">
                {travelling ? <span className="travel">Travelling · </span> : null}
                {city.name} · {offsetLabel(off)}
              </span>
            </div>
            <div className="friend-time">
              <b>{clock(city.tz, now, state.settings.hour24)}</b>
              <span className="muted">
                {rel ? `${rel}, ` : ''}
                {diffLabel(off, myOff)}
              </span>
            </div>
          </button>
        )
      })}

      {state.friends.length === 0 && (
        <div className="empty">
          <p>No friends on your map yet.</p>
          <button className="btn btn-primary" onClick={onAdd}>
            Add friends
          </button>
        </div>
      )}
    </>
  )
}

function DayBar({ tz, myTz, now }: { tz: string; myTz: string; now: Date }) {
  const theirs = localHour(tz, now)
  const mine = localHour(myTz, now)
  const shift = theirs - mine
  return (
    <div className="daybar">
      <div className="daybar-row">
        <span className="daybar-label">Them</span>
        <div className="daybar-track">
          {Array.from({ length: 24 }, (_, h) => (
            <i key={h} className={h < 7 || h >= 23 ? 'n' : h < 9 || h >= 20 ? 'e' : 'd'} />
          ))}
          <em style={{ left: `${(theirs / 24) * 100}%` }} />
        </div>
      </div>
      <div className="daybar-row">
        <span className="daybar-label">You</span>
        <div className="daybar-track">
          {Array.from({ length: 24 }, (_, i) => {
            // Same columns as above (their hours), coloured by what time it is for me.
            const h = (((i - shift) % 24) + 24) % 24
            return <i key={i} className={h < 7 || h >= 23 ? 'n' : h < 9 || h >= 20 ? 'e' : 'd'} />
          })}
          <em style={{ left: `${(theirs / 24) * 100}%` }} />
        </div>
      </div>
      <div className="daybar-legend muted">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  )
}

function FriendDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, update, now, removeFriend, toast } = useApp()
  const u = userById(id)
  const city = cityById(cityOf(state, id, u.home))
  const home = cityById(u.home)
  const myTz = cityById(state.me).tz
  const off = offsetMinutes(city.tz, now)
  const v = vibe(localHour(city.tz, now))
  const rel = relativeDay(city.tz, myTz, now)
  const onWidget = state.settings.widgetFriends.includes(id)

  const toggleWidget = () =>
    update((s) => {
      const list = s.settings.widgetFriends
      if (list.includes(id)) return { ...s, settings: { ...s.settings, widgetFriends: list.filter((x) => x !== id) } }
      if (list.length >= 4) {
        toast('Lock screen fits 4 friends — remove someone first')
        return s
      }
      return { ...s, settings: { ...s.settings, widgetFriends: [...list, id] } }
    })

  return (
    <div className="detail">
      <div className="detail-top">
        <Avatar emoji={u.emoji} color={u.color} size={64} />
        <div>
          <h3>{u.name}</h3>
          <span className="muted">@{u.username}</span>
        </div>
      </div>

      <div className="big-clock">
        <b>{clock(city.tz, now, state.settings.hour24)}</b>
        <span>
          {rel ? `${rel} · ` : ''}
          {dateLine(city.tz, now)}
        </span>
      </div>

      <div className="facts">
        <div>
          <span className="muted">Time zone</span>
          <b>{offsetLabel(off)}</b>
        </div>
        <div>
          <span className="muted">Difference</span>
          <b>{diffLabel(off, offsetMinutes(myTz, now))}</b>
        </div>
        <div>
          <span className="muted">Location</span>
          <b>{city.name}</b>
        </div>
      </div>

      <div className={`vibe ${v.good ? 'good' : 'bad'}`}>
        {v.emoji} {v.label}
      </div>

      {city.id !== home.id ? (
        <div className="status travel">
          ✈️ Travelling — home is {home.name} ({offsetLabel(offsetMinutes(home.tz, now))})
        </div>
      ) : (
        <div className="status">🏠 At home in {home.name}</div>
      )}

      <DayBar tz={city.tz} myTz={myTz} now={now} />

      <div className="actions">
        <button className="btn btn-primary" onClick={() => toast(`👋 Sent to ${u.name.split(' ')[0]}`)}>
          Say hi 👋
        </button>
        <button className="btn" onClick={toggleWidget}>
          {onWidget ? '✓ On lock screen' : 'Add to lock screen'}
        </button>
      </div>
      <button
        className="btn-text danger"
        onClick={() => {
          removeFriend(id)
          onClose()
        }}
      >
        Remove friend
      </button>
    </div>
  )
}

function ProfileView() {
  const { state, update, logout, erase, now } = useApp()
  const p = state.profile!
  const set = (patch: Partial<typeof p>) => update((s) => ({ ...s, profile: { ...s.profile!, ...patch } }))
  const here = cityById(state.me)

  return (
    <div className="profile">
      <div className="profile-avatar">
        <Avatar emoji={p.emoji} color={p.color} size={84} />
        <div className="pickers">
          <div className="emoji-pick">
            {AVATAR_EMOJIS.map((e) => (
              <button key={e} className={e === p.emoji ? 'on' : ''} onClick={() => set({ emoji: e })}>
                {e}
              </button>
            ))}
          </div>
          <div className="color-pick">
            {AVATAR_COLORS.map((c) => (
              <button key={c} className={c === p.color ? 'on' : ''} style={{ background: c }} onClick={() => set({ color: c })} />
            ))}
          </div>
        </div>
      </div>

      <div className="group">
        <label className="group-row">
          <span>Name</span>
          <input value={p.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="group-row">
          <span>Short name</span>
          <input value={p.short} maxLength={5} onChange={(e) => set({ short: e.target.value.toUpperCase().slice(0, 5) })} />
        </label>
        <div className="group-row">
          <span>Username</span>
          <span className="muted">@{p.username}</span>
        </div>
        <label className="group-row">
          <span>Home city</span>
          <select value={p.home} onChange={(e) => set({ home: e.target.value })}>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="group">
        <div className="group-row">
          <span>Your location</span>
          <span className="muted">
            {here.name} · {offsetLabel(offsetMinutes(here.tz, now))}
          </span>
        </div>
        <div className="group-row">
          <span>Email</span>
          <span className="muted">{p.email}</span>
        </div>
        <div className="group-row">
          <span>Phone</span>
          <span className="muted">{p.phone}</span>
        </div>
      </div>

      <div className="group">
        <button className="group-row btn-row" onClick={logout}>
          Log out
        </button>
        <button
          className="group-row btn-row danger"
          onClick={() => confirm('Erase your profile? Friends will no longer see you.') && erase()}
        >
          Erase my profile
        </button>
      </div>
    </div>
  )
}

function SettingsView() {
  const { state, update, setLocked } = useApp()
  const s = state.settings
  const set = (patch: Partial<Settings>) => update((st) => ({ ...st, settings: { ...st.settings, ...patch } }))

  return (
    <div className="settings">
      <p className="group-title">Notifications</p>
      <div className="group">
        <Toggle label="Friend starts travelling" sub="Time sensitive" on={s.notifyTravel} set={(v) => set({ notifyTravel: v })} />
        <Toggle label="Friend is back home" sub="Time sensitive" on={s.notifyHome} set={(v) => set({ notifyHome: v })} />
        <Toggle label="Friend requests" on={s.notifyRequests} set={(v) => set({ notifyRequests: v })} />
        <Toggle label="I changed time zone" on={s.notifyTzChange} set={(v) => set({ notifyTzChange: v })} />
      </div>

      <p className="group-title">Map</p>
      <div className="group">
        <Row label="Style">
          <Seg value={s.mapStyle} options={[['satellite', 'Satellite'], ['dark', 'Dark']]} onChange={(v) => set({ mapStyle: v })} />
        </Row>
        <Toggle label="Show day & night" on={s.night} set={(v) => set({ night: v })} />
        <Toggle label="24-hour clock" on={s.hour24} set={(v) => set({ hour24: v })} />
      </div>

      <p className="group-title">Lock-screen widgets</p>
      <div className="group">
        <Row label="Top line">
          <Seg
            value={s.widgetTop}
            options={[['offset', 'GMT+2'], ['city', 'City'], ['emoji', 'Emoji']]}
            onChange={(v) => set({ widgetTop: v })}
          />
        </Row>
        <Toggle label="Colourful names" on={s.colorfulNames} set={(v) => set({ colorfulNames: v })} />
        <button className="group-row btn-row" onClick={() => setLocked(true)}>
          Preview lock screen ›
        </button>
      </div>

      <p className="group-title">About</p>
      <div className="group">
        <div className="group-row">
          <span>Version</span>
          <span className="muted">0.1 prototype</span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="group-row">
      <span>{label}</span>
      {children}
    </div>
  )
}

function Toggle({ label, sub, on, set }: { label: string; sub?: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="group-row">
      <span>
        {label}
        {sub && <small className="ts">{sub}</small>}
      </span>
      <input type="checkbox" className="switch" checked={on} onChange={(e) => set(e.target.checked)} />
    </label>
  )
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  )
}
