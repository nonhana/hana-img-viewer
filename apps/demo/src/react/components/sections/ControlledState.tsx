import { HanaImgViewer } from 'hana-img-viewer-react'
import { useState } from 'react'
import CodeBlock from '../CodeBlock'
import DemoSection from '../DemoSection'

const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

// Joined per line: the prerender guard rejects SSR bundles containing bare
// `import ... from 'react'` lines, which a template literal would emit verbatim.
const snippet = [
  'import { HanaImgViewer } from \'hana-img-viewer-react\'',
  'import { useState } from \'react\'',
  '',
  'export default function Example() {',
  '  const [open, setOpen] = useState(false)',
  '',
  '  return (',
  '    <>',
  '      <button type="button" onClick={() => setOpen(true)}>Open from the outside</button>',
  '      <HanaImgViewer open={open} onOpenChange={setOpen} src="/photos/garden.png" alt="Garden" />',
  '      <p>open: {String(open)}</p>',
  '    </>',
  '  )',
  '}',
].join('\n')

export default function ControlledState() {
  const [open, setOpen] = useState(false)

  return (
    <DemoSection
      id="controlled-state"
      index="03"
      title="Controlled state"
      apis={['open', 'onOpenChange']}
      description={(
        <>
          Pass
          {' '}
          <code className="
            rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
            text-ink-strong
          "
          >
            open
          </code>
          {' '}
          to drive visibility from outside. The viewer never flips state on its own — it calls
          {' '}
          <code className="
            rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
            text-ink-strong
          "
          >
            onOpenChange
          </code>
          {' '}
          and waits for your state to change, so your state stays the single source of truth.
          Controlled mode is decided at mount.
        </>
      )}
    >
      <figure className="
        m-0 flex flex-col items-center justify-center gap-3.5 rounded-lg border
        border-line-soft bg-surface p-6 shadow-lift
      "
      >
        <button
          type="button"
          className="
            inline-flex cursor-pointer items-center gap-2 rounded-lg border
            border-line bg-surface px-4 py-2 font-mono text-[13px]
            text-ink-strong select-none
            motion-safe:[transition:background-color_300ms_ease-out,border-color_300ms_ease-out,color_300ms_ease-out,transform_300ms_ease-out]
            motion-safe:hover:border-hana-blue-150
            motion-safe:hover:bg-hana-blue-150 motion-safe:hover:text-hana-blue
            motion-safe:active:scale-[0.95]
          "
          onClick={() => setOpen(true)}
        >
          Open from the outside
        </button>
        <HanaImgViewer
          className="block w-full max-w-95"
          open={open}
          onOpenChange={setOpen}
          src={gardenImg}
          alt="Artwork 129115891"
        />
        <figcaption className="
          m-0 text-center font-mono text-xs tracking-[0.02em] text-ink
        "
        >
          open:
          {' '}
          {String(open)}
        </figcaption>
      </figure>
      <CodeBlock file="ControlledState.tsx" code={snippet} />
    </DemoSection>
  )
}
