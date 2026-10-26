import { CITIES, type City } from '../data'

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(key: string, make: () => Intl.DateTimeFormat) {
  let f = formatters.get(key)
  if (!f) {
    f = make()
    formatters.set(key, f)
  }
  return f
}

/** UTC offset of a time zone at a given moment, in minutes (DST aware). */
export function offsetMinutes(tz: string, at: Date): number {
  const label =
    formatter(`off|${tz}`, () => new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }))
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  const m = label.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!m) return 0
  const value = Number(m[2]) * 60 + (m[3] ? Number(m[3]) : 0)
  return m[1] === '-' ? -value : value
}

export function offsetLabel(minutes: number): string {
  if (minutes === 0) return 'GMT'
  const sign = minutes > 0 ? '+' : '−'
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
}

export function clock(tz: string, at: Date, hour24 = true): string {
  return formatter(`clk|${tz}|${hour24}`, () =>
    new Intl.DateTimeFormat(hour24 ? 'en-GB' : 'en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: !hour24 }),
  )
    .format(at)
    .replace(/^0(\d)(?=:\d\d\s?[AP]M)/, '$1')
}

export function dateLine(tz: string, at: Date): string {
  return formatter(`date|${tz}`, () =>
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }),
  ).format(at)
}

function dayKey(tz: string, at: Date): string {
  return formatter(`day|${tz}`, () => new Intl.DateTimeFormat('en-CA', { timeZone: tz })).format(at)
}

/** "Tomorrow" / "Yesterday" relative to my own zone, or null if same day. */
export function relativeDay(tz: string, myTz: string, at: Date): string | null {
  const a = dayKey(tz, at)
  const b = dayKey(myTz, at)
  if (a === b) return null
  return a > b ? 'Tomorrow' : 'Yesterday'
}

/** Local hour as a fraction, e.g. 13.5 for 13:30. */
export function localHour(tz: string, at: Date): number {
  const utc = at.getUTCHours() + at.getUTCMinutes() / 60
  return (((utc + offsetMinutes(tz, at) / 60) % 24) + 24) % 24
}

export function diffLabel(theirs: number, mine: number): string {
  const d = theirs - mine
  if (d === 0) return 'Same time'
  const abs = Math.abs(d)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${d > 0 ? '+' : '−'}${h}h${m ? ` ${m}m` : ''}`
}

export function vibe(hour: number): { emoji: string; label: string; good: boolean } {
  if (hour < 6.5) return { emoji: '😴', label: 'Probably sleeping', good: false }
  if (hour < 9) return { emoji: '☕️', label: 'Morning coffee', good: true }
  if (hour < 18) return { emoji: '💼', label: 'Daytime — good time to call', good: true }
  if (hour < 22.5) return { emoji: '🌆', label: 'Evening — good time to call', good: true }
  return { emoji: '🌙', label: 'Getting late', good: false }
}

/** Best guess of the user's city from the device time zone. */
export function guessCity(): City {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const exact = CITIES.find((c) => c.tz === tz)
  if (exact) return exact
  const now = new Date()
  const off = offsetMinutes(tz, now)
  return CITIES.find((c) => offsetMinutes(c.tz, now) === off) ?? CITIES.find((c) => c.id === 'vie')!
}
