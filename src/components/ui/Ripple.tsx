import type { RippleInstance } from './useRipple'

export function RippleContainer({ ripples }: { ripples: RippleInstance[] }) {
  return (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-dot"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
    </>
  )
}
