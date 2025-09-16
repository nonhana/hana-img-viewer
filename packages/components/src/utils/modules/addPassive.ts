export function addPassive(el: EventTarget, type: string, handler: EventListener) {
  el.addEventListener(type, handler, { passive: true })
  return () => el.removeEventListener(type, handler as EventListener)
}
