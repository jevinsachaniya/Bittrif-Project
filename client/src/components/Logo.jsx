export default function Logo({ size = 'md', white = false }) {
  const sizes = {
    sm: { mark: 34, title: 17, subtitle: 8 },
    md: { mark: 42, title: 21, subtitle: 9 },
    lg: { mark: 56, title: 27, subtitle: 10 },
  }

  const current = sizes[size] || sizes.md
  const titleColor = white ? '#ffffff' : '#082d49'
  const subtitleColor = white ? '#b9e5ff' : '#087fc5'

  return (
    <div className="flex items-center gap-3">
      <svg width={current.mark} height={current.mark} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 20V4H20" stroke="#5e95f4" strokeWidth="5" strokeLinecap="square" />
        <path d="M40 4H56V20" stroke="#5e95f4" strokeWidth="5" strokeLinecap="square" />
        <path d="M4 40V56H20" stroke="#5e95f4" strokeWidth="5" strokeLinecap="square" />
        <path d="M40 56H56V40" stroke="#5e95f4" strokeWidth="5" strokeLinecap="square" />
        <rect x="7" y="23" width="46" height="15" rx="1" fill="#5e95f4" />
        <text x="30" y="34.2" fill="white" textAnchor="middle" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.02em' }}>BITTRIF</text>
      </svg>
      <div className="flex flex-col leading-none">
        <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 800, fontSize: current.title, color: titleColor, letterSpacing: '-0.055em' }}>Bittrif</span>
        <span style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontWeight: 700, fontSize: current.subtitle, color: subtitleColor, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 5 }}>Group of Company</span>
      </div>
    </div>
  )
}
