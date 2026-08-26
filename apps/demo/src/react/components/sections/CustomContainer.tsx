import { HanaImgViewer } from 'hana-img-viewer-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import CodeBlock from '../CodeBlock'
import DemoSection from '../DemoSection'

const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'

// Joined per line: the prerender guard rejects SSR bundles containing bare
// `import ... from 'react'` lines, which a template literal would emit verbatim.
const snippet = [
  'import { HanaImgViewer } from \'hana-img-viewer-react\'',
  'import { useState } from \'react\'',
  '',
  'export default function Example() {',
  '  const [container, setContainer] = useState<HTMLElement | null>(null)',
  '',
  '  return (',
  '    <section className="scrollable-panel">',
  '      <div ref={setContainer} />',
  '      <HanaImgViewer',
  '        container={container}',
  '        closeOnEscape={false}',
  '        src="/photos/artwork.png"',
  '        alt="Artwork"',
  '      />',
  '    </section>',
  '  )',
  '}',
].join('\n')

export default function CustomContainer() {
  const [visible, setVisible] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wasVisibleRef = useRef(false)

  // Escape is bound natively rather than through onKeyDown: the panel is a
  // non-interactive element, so a React handler would trip jsx-a11y.
  useEffect(() => {
    const panel = panelRef.current
    if (visible) {
      panel?.focus()
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape')
          setVisible(false)
      }
      panel?.addEventListener('keydown', handleKeyDown)
      wasVisibleRef.current = true
      return () => panel?.removeEventListener('keydown', handleKeyDown)
    }

    if (wasVisibleRef.current) {
      wasVisibleRef.current = false
      triggerRef.current?.focus()
    }
  }, [visible])

  return (
    <DemoSection
      id="custom-container"
      index="05"
      title="Custom container"
      apis={['container']}
      description={(
        <>
          Mount the overlay anywhere by passing
          {' '}
          <code className="demo-code-inline">container</code>
          . Here it renders inside a scrollable panel in a dialog. While the ref is still
          {' '}
          <code className="demo-code-inline">null</code>
          {' '}
          an open request simply waits — the viewer resolves it as soon as the container exists.
        </>
      )}
    >
      <figure className="demo-card demo-stage">
        <button
          ref={triggerRef}
          type="button"
          className="demo-button"
          onClick={() => setVisible(true)}
        >
          Preview inside a dialog
        </button>
        <figcaption className="demo-stage__note">
          The overlay stays inside the dialog's scroll area.
        </figcaption>
      </figure>
      <CodeBlock file="CustomContainer.tsx" code={snippet} />
      {visible && createPortal(
        <div className="demo-dialog-mask">
          <button
            type="button"
            className="demo-dialog-backdrop"
            tabIndex={-1}
            aria-label="Close preview dialog"
            onClick={() => setVisible(false)}
          />
          <div
            ref={panelRef}
            className="demo-card demo-dialog-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Preview dialog"
            tabIndex={-1}
          >
            <h3>Scroll to the bottom to find the embedded viewer</h3>
            <div className="demo-dialog-scroll">
              <div className="demo-dialog-spacer" />
              <div ref={setContainer} />
              <HanaImgViewer
                className="demo-thumb"
                container={container}
                closeOnEscape={false}
                src={artImg}
                alt="Artwork 121909597"
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </DemoSection>
  )
}
