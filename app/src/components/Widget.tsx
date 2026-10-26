import { cityById, type User } from '../data'
import { clock, offsetLabel, offsetMinutes } from '../lib/time'
import type { WidgetTop } from '../store'

type Props = {
  user: Pick<User, 'short' | 'emoji' | 'color'>
  cityId: string
  now: Date
  top: WidgetTop
  colorful: boolean
  hour24?: boolean
}

/** iOS lock-screen "accessory circular" widget (size 1/4 in the sketch). */
export function CircleWidget({ user, cityId, now, top, colorful, hour24 = true }: Props) {
  const city = cityById(cityId)
  const head = top === 'offset' ? offsetLabel(offsetMinutes(city.tz, now)) : top === 'city' ? city.code : user.emoji
  return (
    <div className="w-circle">
      <span className="w-top">{head}</span>
      <b className="w-time">{clock(city.tz, now, hour24).replace(/\s?[AP]M/, '')}</b>
      <span className="w-name" style={colorful ? { color: user.color } : undefined}>
        {user.short.slice(0, 5)}
      </span>
    </div>
  )
}

/** "Accessory rectangular" widget (size 2/4) — two friends side by side. */
export function RectWidget({ items, now, colorful, hour24 = true }: { items: { user: User; cityId: string }[]; now: Date; colorful: boolean; hour24?: boolean }) {
  return (
    <div className="w-rect">
      {items.map(({ user, cityId }) => {
        const city = cityById(cityId)
        return (
          <div key={user.id} className="w-rect-row">
            <span className="w-rect-name" style={colorful ? { color: user.color } : undefined}>
              {user.emoji} {user.short}
            </span>
            <b>{clock(city.tz, now, hour24)}</b>
            <span className="w-rect-off">{city.code}</span>
          </div>
        )
      })}
    </div>
  )
}
