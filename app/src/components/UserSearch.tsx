import { useState } from 'react'
import { useApp } from '../ctx'
import { CONTACT_IDS, USERS, cityById, userById } from '../data'
import { Avatar } from './Avatar'

/** Search by username + sync contacts + invite. Used in onboarding and in "Add friends". */
export function UserSearch() {
  const { state, addFriend, toast } = useApp()
  const [query, setQuery] = useState('')
  const [synced, setSynced] = useState<'none' | 'loading' | 'done'>('none')
  const [sent, setSent] = useState<string[]>([])

  const q = query.trim().replace(/^@/, '').toLowerCase()
  const results = q ? USERS.filter((u) => u.username.includes(q) || u.name.toLowerCase().includes(q)) : []
  const contacts = synced === 'done' ? CONTACT_IDS.map(userById) : []

  const sync = () => {
    setSynced('loading')
    setTimeout(() => setSynced('done'), 900)
  }

  const add = (id: string) => {
    // Prototype shortcut: contacts accept instantly, strangers get a pending request.
    if (CONTACT_IDS.includes(id)) addFriend(id)
    else {
      setSent((s) => [...s, id])
      toast(`Request sent to @${userById(id).username}`)
      setTimeout(() => addFriend(id), 2500)
    }
  }

  const invite = async () => {
    const link = 'https://timeless.app/invite/' + (state.profile?.username ?? 'me')
    try {
      if (navigator.share) await navigator.share({ title: 'Join me on Timeless', url: link })
      else {
        await navigator.clipboard.writeText(link)
        toast('Invite link copied')
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  const row = (id: string) => {
    const u = userById(id)
    const isFriend = state.friends.includes(id)
    const pending = sent.includes(id) && !isFriend
    return (
      <div className="user-row" key={id}>
        <Avatar emoji={u.emoji} color={u.color} size={38} />
        <div className="user-row-main">
          <b>{u.name}</b>
          <span className="muted">
            @{u.username} · {cityById(u.home).name}
          </span>
        </div>
        <button className={`chip ${isFriend ? 'chip-done' : ''}`} disabled={isFriend || pending} onClick={() => add(id)}>
          {isFriend ? 'Added' : pending ? 'Sent' : 'Add'}
        </button>
      </div>
    )
  }

  return (
    <div className="user-search">
      <div className="search">
        <span>🔍</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by @username" autoCapitalize="none" />
      </div>

      {q ? (
        <div className="list">{results.length ? results.map((u) => row(u.id)) : <p className="muted center">No one called “{q}” yet. Invite them!</p>}</div>
      ) : (
        <>
          <div className="card">
            <h3>Find people you know</h3>
            <div className="sync-row">
              <button className="sync-btn" onClick={sync} disabled={synced !== 'none'}>
                <span>📇</span>
                {synced === 'loading' ? 'Syncing…' : synced === 'done' ? 'Synced' : 'Contacts'}
              </button>
              <button className="sync-btn" onClick={() => toast('Facebook sync — later')}>
                <span>📘</span>Facebook
              </button>
              <button className="sync-btn" onClick={() => toast('Instagram sync — later')}>
                <span>📸</span>Instagram
              </button>
            </div>
          </div>

          {contacts.length > 0 && (
            <>
              <div className="list-head">
                <span>On Timeless from your contacts</span>
                <button className="link" onClick={() => contacts.forEach((u) => !state.friends.includes(u.id) && addFriend(u.id))}>
                  Add all
                </button>
              </div>
              <div className="list">{contacts.map((u) => row(u.id))}</div>
            </>
          )}

          <button className="card invite" onClick={invite}>
            <span className="invite-icon">✉️</span>
            <div>
              <b>Invite friends</b>
              <span className="muted">Send a link to people who aren't on Timeless yet</span>
            </div>
            <span className="chev">›</span>
          </button>
        </>
      )}
    </div>
  )
}
