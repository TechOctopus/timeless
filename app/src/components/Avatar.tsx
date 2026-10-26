type Props = { emoji: string; color: string; size?: number; badge?: string }

export function Avatar({ emoji, color, size = 40, badge }: Props) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.5, background: color }}>
      <span>{emoji}</span>
      {badge && <i className="avatar-badge">{badge}</i>}
    </div>
  )
}
