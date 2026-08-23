import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import type { HanaImgViewerProps } from '@/public-types'

import {
  useCallback,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { ViewerOverlay } from '@/internal/ViewerOverlay'
import { initialViewerState, viewerReducer } from '@/internal/viewerReducer'

const subscribeToHydration = (): (() => void) => () => {}
const getClientSnapshot = (): boolean => true
const getServerSnapshot = (): boolean => false

export const HanaImgViewer = ({
  src,
  previewSrc,
  alt = '',
  open,
  defaultOpen = false,
  onOpenChange,
  container,
  enableZoom = true,
  minZoom = 0.5,
  maxZoom = 10,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  style,
  children,
}: HanaImgViewerProps) => {
  const [isControlled] = useState(() => open !== undefined)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  )
  const [activeContainer, setActiveContainer] = useState<HTMLElement | null>(
    null,
  )
  const [viewerState, dispatch] = useReducer(viewerReducer, initialViewerState)
  const originRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef(false)
  const desiredOpen = isControlled ? open === true : uncontrolledOpen
  const phase = viewerState.phase
  const desiredOpenRef = useRef(desiredOpen)
  const requestedContainer
    = isHydrated
      ? container === undefined
        ? document.body
        : container
      : null

  useLayoutEffect(() => {
    desiredOpenRef.current = desiredOpen
  }, [desiredOpen])

  const requestOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        if (desiredOpen !== nextOpen)
          onOpenChange?.(nextOpen)
        return
      }

      if (desiredOpenRef.current === nextOpen)
        return

      desiredOpenRef.current = nextOpen
      setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [desiredOpen, isControlled, onOpenChange],
  )

  const requestOpen = useCallback(() => {
    requestOpenChange(true)
  }, [requestOpenChange])

  const requestClose = useCallback(() => {
    requestOpenChange(false)
  }, [requestOpenChange])

  const finishOpening = useCallback(() => {
    dispatch({ type: 'OPEN_FINISHED' })
  }, [])

  const finishClosing = useCallback(() => {
    restoreFocusRef.current = true
    dispatch({ type: 'CLOSE_FINISHED' })
  }, [])

  useLayoutEffect(() => {
    if (phase === 'closed') {
      if (desiredOpen && requestedContainer) {
        // Portal ownership can only be committed after the client container exists.
        // eslint-disable-next-line react/set-state-in-effect
        setActiveContainer(requestedContainer)
        dispatch({ type: 'SHOW' })
      }
      else if (activeContainer) {
        // Release the completed portal before accepting a new container.
        // eslint-disable-next-line react/set-state-in-effect
        setActiveContainer(null)
      }
      return
    }

    if (!requestedContainer || requestedContainer !== activeContainer) {
      restoreFocusRef.current = true
      dispatch({ type: 'HIDE' })
      dispatch({ type: 'CLOSE_FINISHED' })
      return
    }

    if (!desiredOpen) {
      dispatch({ type: 'HIDE' })
      return
    }

    dispatch({ type: 'SHOW' })
  }, [activeContainer, desiredOpen, phase, requestedContainer])

  useLayoutEffect(() => {
    if (phase !== 'closed' || !restoreFocusRef.current)
      return

    restoreFocusRef.current = false
    const focusTarget = originRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusTarget?.focus({ preventScroll: true })
  }, [phase])

  const handleThumbnailKeyDown = (
    event: ReactKeyboardEvent<HTMLImageElement>,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      requestOpen()
    }
  }

  const overlayPhase
    = viewerState.phase === 'closed' ? null : viewerState.phase
  const isOverlayMounted = overlayPhase !== null && activeContainer !== null

  return (
    <>
      <div
        ref={originRef}
        className={className}
        style={{
          display: 'inline-block',
          ...style,
          visibility: isOverlayMounted ? 'hidden' : style?.visibility,
        }}
      >
        {children
          ? children({ open: requestOpen })
          : (
              <img
                className="hana-img-viewer-thumbnail"
                src={src}
                alt={alt}
                /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role */
                role="button"
                tabIndex={0}
                onClick={requestOpen}
                onKeyDown={handleThumbnailKeyDown}
              />
            )}
      </div>

      {overlayPhase && activeContainer
        ? (
            <ViewerOverlay
              phase={overlayPhase}
              container={activeContainer}
              originRef={originRef}
              src={src}
              previewSrc={previewSrc}
              alt={alt}
              zoom={enableZoom}
              minZoom={minZoom}
              maxZoom={maxZoom}
              closeOnBackdropClick={closeOnBackdropClick}
              closeOnEscape={closeOnEscape}
              onRequestClose={requestClose}
              onOpenFinished={finishOpening}
              onCloseFinished={finishClosing}
            />
          )
        : null}
    </>
  )
}

export default HanaImgViewer
