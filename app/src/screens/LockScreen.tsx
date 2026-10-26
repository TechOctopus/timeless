import { useState } from 'react'
import { useApp } from '../ctx'
import { cityById, userById } from '../data'
import { dateLine } from '../lib/time'
import { cityOf } from '../store'
import { CircleWidget, RectWidget } from '../components/Widget'
import { NotifCard } from '../components/Notifications'

export function LockScreen() {
  const { state, update, now, notifications, setLocked, focusUser } = useApp()
  const [layout, setLayout] = useState<'circles' | 'rect'>('circles')
  const s = state.settings
  const here = cityById(state.me)
  const ids = (s.widgetFriends.length ? s.widgetFriends : state.friends).filter((id) => state.friends.includes(id)).slice(0, 4)
  const items = ids.map((id) => ({ user: userById(id), cityId: cityOf(state, id, userById(id).home) }))

  const time = new Intl.DateTimeFormat('en-GB', { timeZone: here.tz, hour: '2-digit', minute: '2-digit', hour12: !s.hour24 })
    .format(now)
    .replace(/\s?[ap]m/i, '')

  return (
    <div className="screen lock" onClick={() => setLocked(false)}>
      <div className="lock-top" onClick={(e) => e.stopPropagation()}>
        <div className="lock-date">{dateLine(here.tz, now)}</div>
        <div className="lock-time">{time}</div>

        {items.length === 0 ? (
          <div className="lock-empty">Add friends to see them here</div>
        ) : layout === 'circles' ? (
          <div className="lock-widgets">
            {items.map(({ user, cityId }) => (
              <CircleWidget key={user.id} user={user} cityId={cityId} now={now} top={s.widgetTop} colorful={s.colorfulNames} hour24={s.hour24} />
            ))}
          </div>
        ) : (
          <div className="lock-widgets">
            <RectWidget items={items.slice(0, 2)} now={now} colorful={s.colorfulNames} hour24={s.hour24} />
            {items.length > 2 && <RectWidget items={items.slice(2, 4)} now={now} colorful={s.colorfulNames} hour24={s.hour24} />}
          </div>
        )}

        <div className="lock-config">
          <button className={layout === 'circles' ? 'on' : ''} onClick={() => setLayout('circles')}>
            ◯ 1/4
          </button>
          <button className={layout === 'rect' ? 'on' : ''} onClick={() => setLayout('rect')}>
            ▭ 2/4
          </button>
          <span className="sep" />
          {(['offset', 'city', 'emoji'] as const).map((t) => (
            <button
              key={t}
              className={s.widgetTop === t ? 'on' : ''}
              onClick={() => update((st) => ({ ...st, settings: { ...st.settings, widgetTop: t } }))}
            >
              {t === 'offset' ? 'GMT' : t === 'city' ? 'City' : '🙂'}
            </button>
          ))}
          <button
            className={s.colorfulNames ? 'on' : ''}
            onClick={() => update((st) => ({ ...st, settings: { ...st.settings, colorfulNames: !st.settings.colorfulNames } }))}
          >
            🎨
          </button>
        </div>
      </div>

      <div className="lock-notifs" onClick={(e) => e.stopPropagation()}>
        {notifications.slice(0, 4).map((n) => (
          <NotifCard
            key={n.id}
            n={n}
            onOpen={() => {
              setLocked(false)
              if (n.userId && state.friends.includes(n.userId)) focusUser(n.userId)
            }}
          />
        ))}
      </div>

      <div className="lock-bottom">
        <span className="lock-round">🔦</span>
        <span className="lock-hint">Tap to unlock</span>
        <span className="lock-round">📷</span>
      </div>
      <div className="home-indicator" />
    </div>
  )
}
