interface Props {
  children: React.ReactNode
  className?: string
}

export function MonoChip({ children, className = '' }: Props) {
  return (
    <span className={`mono-chip ${className}`}>
      {children}
    </span>
  )
}
