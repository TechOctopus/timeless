import { useApp } from '../ctx'
import { UserSearch } from '../components/UserSearch'

export function FindFriends() {
  const { state, update } = useApp()
  const n = state.friends.length
  return (
    <div className="screen find-friends">
      <p className="step">Step 2 of 2</p>
      <h1>Find your friends</h1>
      <p className="muted">Add people to see their local time on the map and on your lock screen.</p>
      <UserSearch />
      <div className="bottom-bar">
        <button
          className="btn btn-primary"
          onClick={() =>
            update((s) => ({
              ...s,
              stage: 'main',
              settings: { ...s.settings, widgetFriends: s.settings.widgetFriends.length ? s.settings.widgetFriends : s.friends.slice(0, 4) },
            }))
          }
        >
          {n ? `Done — ${n} friend${n > 1 ? 's' : ''} added →` : 'Skip for now →'}
        </button>
      </div>
    </div>
  )
}
