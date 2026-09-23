function findScrollContainer(element) {
  let parent = element?.parentElement

  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return parent
    parent = parent.parentElement
  }

  return null
}

export function scrollIntoComfortableView(
  element,
  { topGap = 16, bottomGap = 24, scrollContainer } = {}
) {
  if (!element || typeof window === 'undefined') return false

  const container = scrollContainer === undefined
    ? findScrollContainer(element)
    : scrollContainer
  const rect = element.getBoundingClientRect()
  const containerRect = container?.getBoundingClientRect()
  const visibleTop = (containerRect?.top ?? 0) + topGap
  const visibleBottom = (containerRect?.bottom ?? window.innerHeight) - bottomGap

  if (rect.top >= visibleTop && rect.bottom <= visibleBottom) return false

  const prefersReducedMotion = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)'
  ).matches

  element.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
    inline: 'nearest'
  })

  return true
}
