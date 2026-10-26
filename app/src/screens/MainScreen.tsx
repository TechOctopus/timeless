import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../ctx'
import { cityById, userById } from '../data'
import { clock, offsetLabel, offsetMinutes } from '../lib/time'
import { cityOf } from '../store'
import { MapView, type Pin } from '../components/MapView'
import { Sheet, type SheetView } from '../components/Sheet'

export function MainScreen() {
  const { state, update, now, focusedUser, focusUser } = useApp()
  const [view, setView] = useState<SheetView>({ kind: 'list' })
  const [sheetH, setSheetH] = useState(300)
  const onHeight = useCallback((h: number) => setSheetH(h), [])
  const p = state.profile!
  const here = cityById(state.me)

  // Notification taps / external focus open the friend card.
  useEffect(() => {
    if (focusedUser) setView({ kind: 'friend', id: focusedUser })
  }, [focusedUser])

  const pins: Pin[] = useMemo(
    () =>
      state.friends.map((id) => {
        const u = userById(id)
        const cityId = cityOf(state, id, u.home)
        return { id, short: u.short, emoji: u.emoji, color: u.color, cityId, travelling: cityId !== u.home }
      }),
    [state],
  )

  return (
    <div className="screen main">
      <MapView
        now={now}
        pins={pins}
        me={{ emoji: p.emoji, color: p.color, cityId: state.me }}
        selected={view.kind === 'friend' ? view.id : null}
        onSelect={(id) => {
          focusUser(id)
          setView(id ? { kind: 'friend', id } : { kind: 'list' })
        }}
        mapStyle={state.settings.mapStyle}
        night={state.settings.night}
        hour24={state.settings.hour24}
        bottomInset={sheetH}
      />

      <div className="here-pill">
        <span className="here-dot" />
        <div>
          <b>
            {here.name} · {clock(here.tz, now, state.settings.hour24)}
          </b>
          <span>{offsetLabel(offsetMinutes(here.tz, now))} · your time zone</span>
        </div>
      </div>

      <div className="map-buttons" style={{ bottom: sheetH + 12 }}>
        <button
          onClick={() => update((s) => ({ ...s, settings: { ...s.settings, mapStyle: s.settings.mapStyle === 'satellite' ? 'dark' : 'satellite' } }))}
          title="Map style"
        >
          🗺️
        </button>
      </div>

      <Sheet
        view={view}
        setView={(v) => {
          if (v.kind !== 'friend') focusUser(null)
          setView(v)
        }}
        onHeight={onHeight}
      />
    </div>
  )
}
