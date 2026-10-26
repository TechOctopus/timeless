import { createContext, useContext } from 'react'
import type { State } from './store'

export type NotifKind = 'travel' | 'home' | 'request' | 'tz'

export type Notif = {
  id: number
  kind: NotifKind
  title: string
  body: string
  at: Date
  userId?: string
  timeSensitive?: boolean
}

export type Ctx = {
  state: State
  update: (fn: (s: State) => State) => void
  now: Date
  notifications: Notif[]
  toast: (text: string) => void
  addFriend: (id: string) => void
  removeFriend: (id: string) => void
  acceptRequest: (id: string) => void
  declineRequest: (id: string) => void
  moveFriend: (id: string, cityId: string) => void
  moveMe: (cityId: string) => void
  focusUser: (id: string | null) => void
  focusedUser: string | null
  setLocked: (v: boolean) => void
  logout: () => void
  erase: () => void
}

export const AppContext = createContext<Ctx | null>(null)

export function useApp(): Ctx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('AppContext missing')
  return ctx
}
