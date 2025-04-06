export function preventDefault(e: Event): void {
  if (typeof e === 'undefined' || typeof e.preventDefault !== 'function')
    return

  e.preventDefault()
}
