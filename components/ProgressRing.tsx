'use client'
interface Props { label: string; value: number; target: number; unit: string; color: string; invert?: boolean }

export default function ProgressRing({ label, value, target, unit, color, invert }: Props) {
  const pct = target > 0 ? Math.max(0, Math.min(100, (value / target) * 100)) : 0
  const isOverLimit = invert && pct >= 100
  const isWarn = invert ? pct >= 85 : pct >= 45 && pct < 70
  const ringColor = isOverLimit ? 'var(--red)' : isWarn ? 'var(--amber)' : color
  const size = 54; const stroke = 4.5; const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r; const dash = circ - (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold t-text leading-none">
            {value > 999 ? `${(value/1000).toFixed(1)}k` : Math.round(value)}
          </span>
        </div>
      </div>
      <span className="text-[9px] t-muted text-center leading-tight">{label}{unit ? ` (${unit})` : ''}</span>
    </div>
  )
}
