import { avatarColor, initials } from '../lib/format'
import type { User } from '../types'

export default function Avatar({ user, size = 28 }: { user: User; size?: number }) {
  return (
    <span
      className="avatar"
      title={user.name}
      style={{
        background: avatarColor(user.id),
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initials(user.name)}
    </span>
  )
}
