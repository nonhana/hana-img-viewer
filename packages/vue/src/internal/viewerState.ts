export type ViewerPhase = 'closed' | 'opening' | 'open' | 'closing'

export type ViewerEvent
  = | { type: 'SHOW' }
    | { type: 'HIDE' }
    | { type: 'OPEN_FINISHED' }
    | { type: 'CLOSE_FINISHED' }

export const initialViewerPhase: ViewerPhase = 'closed'

export const transitionViewerPhase = (
  phase: ViewerPhase,
  event: ViewerEvent,
): ViewerPhase => {
  switch (event.type) {
    case 'SHOW':
      return phase === 'closed' || phase === 'closing' ? 'opening' : phase
    case 'HIDE':
      return phase === 'opening' || phase === 'open' ? 'closing' : phase
    case 'OPEN_FINISHED':
      return phase === 'opening' ? 'open' : phase
    case 'CLOSE_FINISHED':
      return phase === 'closing' ? 'closed' : phase
  }
}
