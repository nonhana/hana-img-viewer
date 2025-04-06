import type { Ref } from 'vue'

export function getTargetPosition(targetRef: Ref<HTMLElement | null>): readonly [number, number] {
  if (!targetRef.value)
    return [0, 0]

  const transform = window.getComputedStyle(targetRef.value).transform
  if (transform === 'none')
    return [0, 0]

  const match = transform.match(/matrix\((.+)\)/)
  if (!match)
    return [0, 0]

  const values = match[1].split(', ')
  return [
    Number.parseFloat(values[4]) || 0,
    Number.parseFloat(values[5]) || 0,
  ] as const
}
