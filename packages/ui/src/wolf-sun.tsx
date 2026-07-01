import { cn } from './utils'

// The signature hero art from the mocks (transparent PNG, reads on any theme).
// `sun` = wolf facing forward + rising sun; `rear` = wolf from behind (404).
// The parent sets the size via className; object-contain preserves the aspect.
const SOURCES = {
  sun: '/images/wolf-sun-transparent.png',
  rear: '/images/wolf-rear-and-sun.png',
} as const

export function WolfSun({
  variant = 'sun',
  className,
}: {
  variant?: keyof typeof SOURCES
  className?: string
}) {
  return (
    <img
      src={SOURCES[variant]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('object-contain select-none', className)}
    />
  )
}
