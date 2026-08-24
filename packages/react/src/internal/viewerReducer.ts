export type ViewerPhase = 'closed' | 'opening' | 'open' | 'closing'

export interface ViewerState {
  phase: ViewerPhase
}

export type ViewerEvent
  = | { type: 'SHOW' }
    | { type: 'HIDE' }
    | { type: 'OPEN_FINISHED' }
    | { type: 'CLOSE_FINISHED' }

export const initialViewerState: ViewerState = { phase: 'closed' }

export const viewerReducer = (
  state: ViewerState,
  event: ViewerEvent,
): ViewerState => {
  switch (event.type) {
    case 'SHOW':
      return state.phase === 'closed' || state.phase === 'closing'
        ? { phase: 'opening' }
        : state
    case 'HIDE':
      return state.phase === 'opening' || state.phase === 'open'
        ? { phase: 'closing' }
        : state
    case 'OPEN_FINISHED':
      return state.phase === 'opening' ? { phase: 'open' } : state
    case 'CLOSE_FINISHED':
      return state.phase === 'closing' ? { phase: 'closed' } : state
  }
}
