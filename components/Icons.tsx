import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function IconBase({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function ClipboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 5h6" />
      <path d="M9 3.75A2.25 2.25 0 0 0 6.75 6v.5h10.5V6A2.25 2.25 0 0 0 15 3.75" />
      <path d="M7 5.75H5.75A1.75 1.75 0 0 0 4 7.5v11A1.75 1.75 0 0 0 5.75 20.25h12.5A1.75 1.75 0 0 0 20 18.5v-11a1.75 1.75 0 0 0-1.75-1.75H17" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </IconBase>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5v3" />
      <path d="M17 3.5v3" />
      <rect x="4" y="5.5" width="16" height="15" rx="2.25" />
      <path d="M4 10h16" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 17h.01" />
      <path d="M12 17h.01" />
    </IconBase>
  )
}

export function ChartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19.5h16" />
      <path d="M7 16l3.25-4 3 2.5L18 7" />
      <path d="M18 7v4.5" />
      <path d="M18 7h-4.5" />
    </IconBase>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.2 13.6a7.8 7.8 0 0 0 .05-3.2l-2.05-.45a5.8 5.8 0 0 0-.75-1.3l.65-2-2.75-1.6-1.42 1.55a6.1 6.1 0 0 0-1.5 0L10 5.05 7.25 6.65l.65 2a5.8 5.8 0 0 0-.75 1.3l-2.05.45a7.8 7.8 0 0 0 0 3.2l2.05.45c.18.47.43.9.75 1.3l-.65 2L10 18.95l1.43-1.55a6.1 6.1 0 0 0 1.5 0l1.42 1.55 2.75-1.6-.65-2c.32-.4.57-.83.75-1.3z" />
    </IconBase>
  )
}

export function WatchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 3.5h6l.75 3H8.25z" />
      <path d="M8.25 17.5h7.5l-.75 3H9z" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="3" />
      <path d="M12 9.5V12l2 1.2" />
    </IconBase>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 10.5a6 6 0 1 0-12 0c0 6-2 6.5-2 6.5h16s-2-.5-2-6.5" />
      <path d="M9.75 20a2.5 2.5 0 0 0 4.5 0" />
    </IconBase>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6.5h16" />
      <path d="M9 6.5V4.75h6V6.5" />
      <path d="M7 6.5l.75 13h8.5L17 6.5" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
    </IconBase>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  )
}

export function DumbbellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 8v8" />
      <path d="M8 7v10" />
      <path d="M16 7v10" />
      <path d="M19 8v8" />
      <path d="M8 12h8" />
    </IconBase>
  )
}

export function LeafIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 19c8.5-.5 13-5.5 14-14-8.5 1-13.5 5.5-14 14z" />
      <path d="M5 19c2.75-4.75 6.25-7.75 10.5-9" />
    </IconBase>
  )
}

export function BowlIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 11.5h14a7 7 0 0 1-14 0z" />
      <path d="M8 19h8" />
      <path d="M9 8.5c0-1 .75-1.25.75-2.25" />
      <path d="M12 8.5c0-1 .75-1.25.75-2.25" />
      <path d="M15 8.5c0-1 .75-1.25.75-2.25" />
    </IconBase>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 15.5A7.5 7.5 0 0 1 8.5 5a7.75 7.75 0 1 0 10.5 10.5z" />
    </IconBase>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 11.5 12 5l7.5 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
      <path d="M10 19v-5h4v5" />
    </IconBase>
  )
}
