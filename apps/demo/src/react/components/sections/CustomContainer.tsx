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
          <code className="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">container</code>
          . Here it renders inside a scrollable panel in a dialog. While the ref is still
          {' '}
          <code className="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">null</code>
          {' '}
          an open request simply waits — the viewer resolves it as soon as the container exists.
        </>
      )}
    >
      <figure className="m-0 flex flex-col items-center justify-center gap-3.5 rounded-[8px] border border-line-soft bg-surface p-6 shadow-lift">
        <button
          ref={triggerRef}
          type="button"
          className="inline-flex cursor-pointer select-none items-center gap-2 rounded-[8px] border border-line bg-surface px-4 py-2 font-mono text-[13px] text-ink-strong motion-safe:[transition:background-color_300ms_ease-out,border-color_300ms_ease-out,color_300ms_ease-out,transform_300ms_ease-out] motion-safe:hover:border-hana-blue-150 motion-safe:hover:bg-hana-blue-150 motion-safe:hover:text-hana-blue motion-safe:active:scale-[0.95]"
          onClick={() => setVisible(true)}
        >
          Preview inside a dialog
        </button>
        <figcaption className="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
          The overlay stays inside the dialog's scroll area.
        </figcaption>
      </figure>
      <CodeBlock file="CustomContainer.tsx" code={snippet} />
      {visible && createPortal(
        <div className="fixed inset-0 z-10000 grid place-items-center p-6">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer border-0 bg-black/40 p-0"
            tabIndex={-1}
            aria-label="Close preview dialog"
            onClick={() => setVisible(false)}
          />
          <div
            ref={panelRef}
            className="relative flex max-h-[80vh] w-[min(480px,100%)] flex-col gap-3 rounded-[8px] border border-line-soft bg-surface p-6 shadow-lift"
            role="dialog"
            aria-modal="true"
            aria-label="Preview dialog"
            tabIndex={-1}
          >
            <h3 className="text-[18px]">Scroll to the bottom to find the embedded viewer</h3>
            <div className="overflow-auto rounded-[6px] border border-line-soft p-3">
              <div className="h-[1200px]" />
              <div ref={setContainer} />
              <HanaImgViewer
                className="block w-full max-w-[380px]"
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
