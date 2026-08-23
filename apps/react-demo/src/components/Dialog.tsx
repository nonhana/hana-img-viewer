import { HanaImgViewer } from 'hana-img-viewer-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Minimal dialog demo mirroring the Vue example: the viewer mounts inside a
 * custom portal target rendered in a tall, scrollable dialog body.
 */
export default function Dialog() {
  const [visible, setVisible] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wasVisibleRef = useRef(false)

  useEffect(() => {
    const panel = panelRef.current
    if (visible) {
      panel?.focus()
      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape')
          setVisible(false)
      }
      panel?.addEventListener('keydown', handleKeyDown)
      wasVisibleRef.current = true
      return () => panel?.removeEventListener('keydown', handleKeyDown)
    }

    if (wasVisibleRef.current)
      triggerRef.current?.focus()

    wasVisibleRef.current = visible
  }, [visible])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="example-button"
        onClick={() => setVisible(true)}
      >
        Preview inside a dialog
      </button>
      {visible
        && createPortal(
          <div className="dialog-mask">
            <button
              type="button"
              className="dialog-backdrop"
              tabIndex={-1}
              aria-label="Close preview dialog"
              onClick={() => setVisible(false)}
            />
            <div
              ref={panelRef}
              className="dialog-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Preview dialog"
              tabIndex={-1}
            >
              <h3>Scroll to the bottom to inspect the embedded viewer</h3>
              <div className="dialog-inner-scroll">
                <div className="dialog-spacer" />
                <div ref={setContainer} />
                <HanaImgViewer
                  container={container}
                  closeOnEscape={false}
                  src="https://pixiv-r2.caelum.moe/121909597.png"
                  alt="121909597.png"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
