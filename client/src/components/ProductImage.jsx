// Keep pointer movement out of React state so image inspection stays smooth.
export default function ProductImage({ src, alt, className = '', imageClassName = '', children, loading = 'lazy' }) {
  const moveFocus = (event) => {
    if (event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--zoom-x', ((event.clientX - bounds.left) / bounds.width) * 100 + '%')
    event.currentTarget.style.setProperty('--zoom-y', ((event.clientY - bounds.top) / bounds.height) * 100 + '%')
  }
  const resetFocus = (event) => {
    event.currentTarget.style.setProperty('--zoom-x', '50%')
    event.currentTarget.style.setProperty('--zoom-y', '50%')
  }

  return <div className={'product-image-frame ' + className} onPointerMove={moveFocus} onPointerLeave={resetFocus}>
    <img src={src} alt={alt} loading={loading} className={'product-zoom-image ' + imageClassName} />
    <span className="product-image-sheen" aria-hidden="true" />
    {children}
  </div>
}
