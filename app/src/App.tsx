import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext, type Ctx, type Notif, type NotifKind } from './ctx'
import { CITIES, CONTACT_IDS, USERS, cityById, userById } from './data'
import { clock, offsetLabel, offsetMinutes } from './lib/time'
import { cityOf, useStore } from './store'
import { Register } from './screens/Register'
import { FindFriends } from './screens/FindFriends'
import { MainScreen } from './screens/MainScreen'
import { LockScreen } from './screens/LockScreen'
import { NotifCard } from './components/Notifications'

const PHONE_W = 393
const PHONE_H = 852

export default function App() {
  const { state, update, reset } = useStore()
  const [shiftH, setShiftH] = useState(0)
  const [tick, setTick] = useState(() => Date.now())
  const [locked, setLocked] = useState(false)
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [banner, setBanner] = useState<Notif | null>(null)
  const [toastText, setToastText] = useState<string | null>(null)
  const [focusedUser, setFocusedUser] = useState<string | null>(null)
  const nextId = useRef(1)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const now = useMemo(() => new Date(tick + shiftH * 3600_000), [tick, shiftH])

  const toast = useCallback((text: string) => {
    setToastText(text)
    setTimeout(() => setToastText((t) => (t === text ? null : t)), 2200)
  }, [])

  const notify = useCallback((kind: NotifKind, title: string, body: string, userId?: string) => {
    const n: Notif = { id: nextId.current++, kind, title, body, userId, at: new Date(), timeSensitive: kind === 'travel' || kind === 'home' }
    setNotifications((list) => [n, ...list].slice(0, 20))
    setBanner(n)
  }, [])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), banner.kind === 'request' || banner.kind === 'tz' ? 9000 : 5500)
    return () => clearTimeout(t)
  }, [banner])

  const addFriend = useCallback(
    (id: string) =>
      update((s) =>
        s.friends.includes(id)
          ? s
          : {
              ...s,
              friends: [...s.friends, id],
              requests: s.requests.filter((r) => r !== id),
              settings: s.stage === 'main' && s.settings.widgetFriends.length < 4 ? { ...s.settings, widgetFriends: [...s.settings.widgetFriends, id] } : s.settings,
            },
      ),
    [update],
  )

  const ctx: Ctx = {
    state,
    update,
    now,
    notifications,
    toast,
    addFriend,
    focusedUser,
    focusUser: setFocusedUser,
    setLocked,
    removeFriend: (id) =>
      update((s) => ({
        ...s,
        friends: s.friends.filter((f) => f !== id),
        settings: { ...s.settings, widgetFriends: s.settings.widgetFriends.filter((f) => f !== id) },
      })),
    acceptRequest: (id) => {
      addFriend(id)
      toast(`You and ${userById(id).name.split(' ')[0]} are now friends`)
    },
    declineRequest: (id) => update((s) => ({ ...s, requests: s.requests.filter((r) => r !== id) })),
    moveFriend: (id, cityId) => {
      const s = stateRef.current
      const u = userById(id)
      const prev = cityById(cityOf(s, id, u.home))
      const next = cityById(cityId)
      update((st) => {
        const locations = { ...st.locations }
        if (cityId === u.home) delete locations[id]
        else locations[id] = cityId
        return { ...st, locations }
      })
      if (!s.friends.includes(id)) return
      const first = u.name.split(' ')[0]
      const at = new Date()
      if (cityId === u.home && prev.id !== u.home) {
        if (s.settings.notifyHome)
          notify('home', `${first} is back home!`, 'They have just arrived to their home time zone. Ask them how was their trip!', id)
      } else if (offsetMinutes(prev.tz, at) !== offsetMinutes(next.tz, at)) {
        if (s.settings.notifyTravel)
          notify(
            'travel',
            `${first} is travelling!`,
            `They have just switched their time zone to ${offsetLabel(offsetMinutes(next.tz, at))}. Check up with them!`,
            id,
          )
      } else toast(`${first} moved to ${next.name} — same time zone, no notification`)
    },
    moveMe: (cityId) => {
      const s = stateRef.current
      const at = new Date()
      const prev = cityById(s.me)
      const next = cityById(cityId)
      update((st) => ({ ...st, me: cityId }))
      if (offsetMinutes(prev.tz, at) !== offsetMinutes(next.tz, at) && s.settings.notifyTzChange)
        notify(
          'tz',
          'Seems like you are in a different time zone!',
          `You're now in ${next.name} (${offsetLabel(offsetMinutes(next.tz, at))}). Let your friends know?`,
        )
    },
    logout: () => {
      reset()
      setLocked(false)
      toast('Logged out')
    },
    erase: () => {
      reset()
      setLocked(false)
      setNotifications([])
      toast('Your profile was erased')
    },
  }

  const sendRequest = () => {
    const s = stateRef.current
    const candidate = USERS.find((u) => !s.friends.includes(u.id) && !s.requests.includes(u.id) && !CONTACT_IDS.includes(u.id))
    if (!candidate) return toast('Everyone is already your friend 🙂')
    update((st) => ({ ...st, requests: [...st.requests, candidate.id] }))
    if (s.settings.notifyRequests) notify('request', 'Friend request', `@${candidate.username} wants to be your friend! Add them?`, candidate.id)
  }

  const openBanner = (n: Notif) => {
    setBanner(null)
    setLocked(false)
    if (n.userId && state.friends.includes(n.userId)) setFocusedUser(n.userId)
  }

  const bannerActions = (n: Notif) => {
    if (n.kind === 'request' && n.userId && state.requests.includes(n.userId))
      return (
        <>
          <button onClick={() => (ctx.acceptRequest(n.userId!), setBanner(null))}>Add</button>
          <button onClick={() => (ctx.declineRequest(n.userId!), setBanner(null))}>Decline</button>
        </>
      )
    if (n.kind === 'tz')
      return (
        <>
          <button onClick={() => (toast('Your friends were notified ✈️'), setBanner(null))}>Let them know</button>
          <button onClick={() => setBanner(null)}>Not now</button>
        </>
      )
    return undefined
  }

  const mobile = useMediaQuery('(max-width: 520px)')
  const scale = useFitScale()
  const [demoOpen, setDemoOpen] = useState(false)
  const here = cityById(state.me)

  const screen = locked ? (
    <LockScreen />
  ) : state.stage === 'register' || !state.profile ? (
    <Register />
  ) : state.stage === 'friends' ? (
    <FindFriends />
  ) : (
    <MainScreen />
  )

  const phone = (
    <div className={`phone ${mobile ? 'phone-full' : ''}`} style={mobile ? undefined : { width: PHONE_W, height: PHONE_H, transform: `scale(${scale})` }}>
      <div className="phone-screen">
        {!mobile && (
          <div className="status-bar">
            <span className="sb-time">{locked ? '' : clock(here.tz, now, true).replace(/^0/, '')}</span>
            <span className="island" />
            <span className="sb-icons">
              <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor">
                <rect x="0" y="7" width="3" height="4" rx="1" />
                <rect x="5" y="5" width="3" height="6" rx="1" />
                <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
                <rect x="15" y="0" width="3" height="11" rx="1" />
              </svg>
              <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
                <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.2A10 10 0 0 0 8 .5 10 10 0 0 0 .8 3.4L2 4.6a8.4 8.4 0 0 1 6-2.4zm0 3.3c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 3.8c-1.8 0-3.5.7-4.8 1.9l1.2 1.2c1-.9 2.2-1.4 3.6-1.4zM8 8.7l2.4-1.4A3.4 3.4 0 0 0 8 6.9c-.9 0-1.8.4-2.4 1z" />
              </svg>
              <span className="battery">
                <i />
              </span>
            </span>
          </div>
        )}
        {screen}
        {banner && !locked && (
          <div className="banner">
            <NotifCard n={banner} onOpen={() => openBanner(banner)} actions={bannerActions(banner)} />
          </div>
        )}
        {toastText && <div className="toast">{toastText}</div>}
      </div>
    </div>
  )

  return (
    <AppContext.Provider value={ctx}>
      <div className={`stage ${mobile ? 'stage-mobile' : ''}`}>
        <div className="phone-slot" style={mobile ? undefined : { width: PHONE_W * scale, height: PHONE_H * scale }}>
          {phone}
        </div>
        {(!mobile || demoOpen) && (
          <Demo
            ctx={ctx}
            onClose={mobile ? () => setDemoOpen(false) : undefined}
            shiftH={shiftH}
            setShiftH={setShiftH}
            locked={locked}
            sendRequest={sendRequest}
            reset={() => {
              reset()
              setLocked(false)
              setNotifications([])
              setShiftH(0)
            }}
          />
        )}
        {mobile && !demoOpen && (
          <button className="demo-fab" onClick={() => setDemoOpen(true)}>
            Demo
          </button>
        )}
      </div>
    </AppContext.Provider>
  )

}

function Demo({
  ctx,
  onClose,
  shiftH,
  setShiftH,
  locked,
  sendRequest,
  reset,
}: {
  ctx: Ctx
  onClose?: () => void
  shiftH: number
  setShiftH: (h: number) => void
  locked: boolean
  sendRequest: () => void
  reset: () => void
}) {
  const { state, update, setLocked, moveFriend, moveMe } = ctx
  const [who, setWho] = useState('')
  const [where, setWhere] = useState('tyo')
  const [myCity, setMyCity] = useState('tyo')
  const friendId = state.friends.includes(who) ? who : state.friends[0] ?? ''
  const ready = state.stage === 'main' && state.profile

  const quickStart = () =>
    update((s) => ({
      ...s,
      stage: 'main',
      profile: s.profile ?? {
        name: 'Heorhi Davydau',
        username: 'heorhi',
        dob: '',
        short: 'GEO',
        email: 'demo@timeless.app',
        phone: '+43 660 000 0000',
        emoji: '😎',
        color: '#f5d90a',
        home: s.me,
      },
      friends: s.friends.length ? s.friends : CONTACT_IDS,
      settings: { ...s.settings, widgetFriends: s.settings.widgetFriends.length ? s.settings.widgetFriends : CONTACT_IDS.slice(0, 4) },
    }))

  return (
    <aside className="demo">
      <div className="demo-head">
        <h2>Timeless · prototype</h2>
        {onClose && (
          <button className="link" onClick={onClose}>
            Close
          </button>
        )}
      </div>
      <p className="muted">Clickable mock-up of the iPhone app. Use these controls to simulate what would happen in real life.</p>

      <section>
        <h4>Screens</h4>
        <div className="demo-btns">
          <button onClick={() => (setLocked(false), update((s) => ({ ...s, stage: 'register' })))}>1 · Registration</button>
          <button disabled={!state.profile} onClick={() => (setLocked(false), update((s) => ({ ...s, stage: 'friends' })))}>
            2 · Find friends
          </button>
          <button onClick={() => (setLocked(false), quickStart())}>3 · Main map</button>
          <button disabled={!ready} className={locked ? 'on' : ''} onClick={() => setLocked(!locked)}>
            🔒 Lock screen
          </button>
        </div>
        {!ready && (
          <button className="demo-primary" onClick={quickStart}>
            Skip onboarding with a demo account →
          </button>
        )}
      </section>

      <section className={ready ? '' : 'disabled'}>
        <h4>A friend travels</h4>
        <div className="demo-row">
          <select value={friendId} onChange={(e) => setWho(e.target.value)}>
            {state.friends.map((id) => (
              <option key={id} value={id}>
                {userById(id).name}
              </option>
            ))}
          </select>
          <span>→</span>
          <select value={where} onChange={(e) => setWhere(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="demo-btns">
          <button disabled={!friendId} onClick={() => moveFriend(friendId, where)}>
            ✈️ Fly there
          </button>
          <button disabled={!friendId} onClick={() => moveFriend(friendId, userById(friendId).home)}>
            🏠 Send home
          </button>
        </div>
        <p className="hint">Triggers notifications 1 & 2 from the sketch (time sensitive).</p>
      </section>

      <section className={ready ? '' : 'disabled'}>
        <h4>You travel</h4>
        <div className="demo-row">
          <select value={myCity} onChange={(e) => setMyCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button onClick={() => moveMe(myCity)}>Land here</button>
        </div>
        <p className="hint">Notification 4: “Seems like you are in a different time zone!”</p>
      </section>

      <section className={ready ? '' : 'disabled'}>
        <h4>Friend request</h4>
        <div className="demo-btns">
          <button onClick={sendRequest}>📨 Someone adds you</button>
        </div>
      </section>

      <section>
        <h4>
          Time travel <span className="muted">{shiftH === 0 ? 'now' : `${shiftH > 0 ? '+' : ''}${shiftH}h`}</span>
        </h4>
        <input type="range" min={-12} max={12} step={0.5} value={shiftH} onChange={(e) => setShiftH(Number(e.target.value))} />
        <p className="hint">Scrub the clock to watch day/night and everyone's time move.</p>
      </section>

      <section>
        <button className="danger-link" onClick={reset}>
          Reset prototype
        </button>
      </section>
    </aside>
  )
}

function useMediaQuery(q: string) {
  const [m, setM] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const mq = matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

function useFitScale() {
  const calc = () => Math.min(1, (window.innerHeight - 32) / PHONE_H)
  const [s, setS] = useState(calc)
  useEffect(() => {
    const on = () => setS(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return s
}
