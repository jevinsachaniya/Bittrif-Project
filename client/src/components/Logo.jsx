export default function Logo({ size = 'md', white = false }) {
  const sizes = {
    sm: { mark: 34, title: 17, subtitle: 8 },
    md: { mark: 42, title: 21, subtitle: 9 },
    lg: { mark: 56, title: 27, subtitle: 10 },
  }

  const current = sizes[size] || sizes.md
  const titleColor = white ? '#ffffff' : '#431407'
  const subtitleColor = white ? '#fed7aa' : '#c2410c'

  return (
    <div className="flex items-center gap-3">
      <svg width={current.mark} height={current.mark} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="5" y="8" width="50" height="47" rx="15" fill="#ea580c" />
        <path d="M20 22C20 16.477 24.477 12 30 12C35.523 12 40 16.477 40 22" stroke="#fff7ed" strokeWidth="4" strokeLinecap="round" />
        <path d="M20 25V42L40 25V42" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col leading-none">
        <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 800, fontSize: current.title, color: titleColor, letterSpacing: '-0.055em' }}>Nivora</span>
        <span style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontWeight: 700, fontSize: current.subtitle, color: subtitleColor, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 5 }}>Everyday market</span>
      </div>
    </div>
  )
}
