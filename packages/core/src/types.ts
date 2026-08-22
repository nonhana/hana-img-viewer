export interface Point {
  x: number
  y: number
}

export interface Transform {
  x: number
  y: number
  scale: number
}

export interface ViewerTransformAnchor {
  point: Point
  viewportCenter: Point
}

export type ViewerInteractionPhase = 'closed' | 'opening' | 'open' | 'closing'

export type ViewerSourcePhase = 'base' | 'enhancing' | 'enhanced' | 'enhance-error'

export type PortalTarget = string | HTMLElement | null

export interface WheelState {
  delta: number
  center: Point
  isTrackpad: boolean
  event: WheelEvent
}

export interface PinchState {
  scale: number
  center: Point
  deltaScale: number
  distance: number
  isFirst: boolean
  isLast: boolean
  event: TouchEvent
}

export const DEFAULT_TRANSFORM: Readonly<Transform> = {
  x: 0,
  y: 0,
  scale: 1,
}
