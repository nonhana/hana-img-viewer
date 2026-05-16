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

export const DEFAULT_TRANSFORM: Readonly<Transform> = {
  x: 0,
  y: 0,
  scale: 1,
}
