interface Props {
  className?: string
  lines?: number
}

export function Skeleton({ className = 'h-4 w-full', lines }: Props) {
  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`skeleton ${className} ${i === lines - 1 ? 'w-3/4' : ''}`} />
        ))}
      </div>
    )
  }
  return <div className={`skeleton ${className}`} />
}
