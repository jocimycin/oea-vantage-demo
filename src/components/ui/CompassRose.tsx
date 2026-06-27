interface Props {
  degrees: number
  size?: number
}

export function CompassRose({ degrees, size = 48 }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative rounded-full border border-oea-border flex items-center justify-center"
        style={{ width: size, height: size, background: '#0a1a28' }}
      >
        {/* Cardinal labels */}
        {[
          { label: 'N', deg: 0,   x: 50, y: 8  },
          { label: 'E', deg: 90,  x: 88, y: 50 },
          { label: 'S', deg: 180, x: 50, y: 92 },
          { label: 'W', deg: 270, x: 12, y: 50 },
        ].map(({ label, x, y }) => (
          <span
            key={label}
            className="absolute text-[7px] font-bold text-oea-text-muted select-none"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
          >
            {label}
          </span>
        ))}
        {/* Arrow */}
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          style={{ transform: `rotate(${degrees}deg)`, transition: 'transform 0.5s ease' }}
        >
          {/* North arrow (blue) */}
          <path d="M12 3 L15 12 L12 10 L9 12 Z" fill="#1574b6" />
          {/* South arrow (muted) */}
          <path d="M12 21 L15 12 L12 14 L9 12 Z" fill="#5a7a90" />
        </svg>
      </div>
      <span className="font-mono text-[10px] text-oea-text-muted">{degrees}°</span>
    </div>
  )
}
