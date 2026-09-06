export function flyToCart(sourceEl, targetEl) {
  if (!sourceEl || !targetEl) return

  const startRect = sourceEl.getBoundingClientRect()
  const endRect = targetEl.getBoundingClientRect()

  const ghost = document.createElement('div')
  ghost.textContent = '🛍️'
  ghost.style.position = 'fixed'
  ghost.style.left = `${startRect.left + startRect.width / 2 - 12}px`
  ghost.style.top = `${startRect.top + startRect.height / 2 - 12}px`
  ghost.style.fontSize = '22px'
  ghost.style.lineHeight = '1'
  ghost.style.zIndex = '100'
  ghost.style.pointerEvents = 'none'
  ghost.style.transition = 'transform 0.55s cubic-bezier(0.3, 0, 0.6, 1), opacity 0.55s ease-in'
  ghost.style.willChange = 'transform, opacity'
  document.body.appendChild(ghost)

  const dx = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2)
  const dy = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2)

  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.25)`
    ghost.style.opacity = '0.15'
  })

  ghost.addEventListener('transitionend', () => {
    ghost.remove()
    targetEl.classList.add('cart-bump')
    setTimeout(() => targetEl.classList.remove('cart-bump'), 300)
  })
}
