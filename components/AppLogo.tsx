interface AppLogoProps {
  size?: number
  id?: string
}

export default function AppLogo({ size = 36, id = 'alg' }: AppLogoProps) {
  const gradId = `${id}-bg`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill={`url(#${gradId})`} />
      <circle cx="20" cy="27" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="36" cy="18" r="2.5" fill="white" fillOpacity="0.65" />
      <circle cx="52" cy="15" r="3.5" fill="white" fillOpacity="0.95" />
      <circle cx="68" cy="18" r="2.5" fill="white" fillOpacity="0.65" />
      <circle cx="82" cy="27" r="2" fill="white" fillOpacity="0.4" />
      <path
        d="M22 26 L34 19 M38 18 L50 16 M54 16 L66 19 M70 19 L80 26"
        stroke="white" strokeOpacity="0.28" strokeWidth="1.2" strokeLinecap="round"
      />
      <path
        d="M20 54 L40 75 L80 30"
        stroke="white" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.95"
      />
      <circle cx="40" cy="75" r="5.5" fill="white" fillOpacity="0.15" />
      <circle cx="40" cy="75" r="5.5" stroke="white" strokeWidth="3" />
    </svg>
  )
}
