'use client'
interface Props {
  label: string
  value: number
  target: number
  unit: string
  color: string
  invert?: boolean
}

export default function ProgressRing({ label, value, target, unit, color, invert }: Props) {
  const pct = Math.min(100, (value / target) * 100)
  const isGood = invert ? pct < 90 : pct >= 70
  const isWarn = invert ? pct >= 90 : pct >= 50 && pct < 70
  const displayColor = isGood ? color : isWarn ? '#F59E0B' : '#666'
  const size = 52
  const stroke = 4
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ - (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#222" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={displayColor} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold text-white leading-none">
            {value > 999 ? `${Math.round(value/100)/10}k` : Math.round(value)}
          </span>
        </div>
      </div>
      <span className="text-[9px] text-gray-500 text-center leading-tight">{label}{unit ? ` (${unit})` : ''}</span>
    </div>
  )
}
