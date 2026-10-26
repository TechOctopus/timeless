import { useCallback, useEffect, useState } from 'react'
import { INITIAL_LOCATIONS } from './data'
import { guessCity } from './lib/time'

export type Profile = {
  name: string
  username: string
  dob: string
  short: string
  email: string
  phone: string
  emoji: string
  color: string
  home: string
}

export type WidgetTop = 'offset' | 'city' | 'emoji'

export type Settings = {
  notifyTravel: boolean
  notifyHome: boolean
  notifyRequests: boolean
  notifyTzChange: boolean
  mapStyle: 'satellite' | 'dark'
  night: boolean
  hour24: boolean
  widgetTop: WidgetTop
  colorfulNames: boolean
  widgetFriends: string[]
}

export type Stage = 'register' | 'friends' | 'main'

export type State = {
  stage: Stage
  profile: Profile | null
  friends: string[]
  requests: string[]
  /** userId -> cityId, only for people who are away from home. */
  locations: Record<string, string>
  /** City the device is currently in. */
  me: string
  settings: Settings
}

const KEY = 'timeless.prototype.v1'

export function initialState(): State {
  const city = guessCity()
  return {
    stage: 'register',
    profile: null,
    friends: [],
    requests: [],
    locations: { ...INITIAL_LOCATIONS },
    me: city.id,
    settings: {
      notifyTravel: true,
      notifyHome: true,
      notifyRequests: true,
      notifyTzChange: true,
      mapStyle: 'satellite',
      night: true,
      hour24: true,
      widgetTop: 'offset',
      colorfulNames: true,
      widgetFriends: [],
    },
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const base = initialState()
      const saved = JSON.parse(raw) as State
      return { ...base, ...saved, settings: { ...base.settings, ...saved.settings } }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return initialState()
}

export function useStore() {
  const [state, setState] = useState<State>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const update = useCallback((fn: (s: State) => State) => setState(fn), [])
  const reset = useCallback(() => setState(initialState()), [])

  return { state, update, reset }
}

export function cityOf(state: State, userId: string, home: string): string {
  return state.locations[userId] ?? home
}
