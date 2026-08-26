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
          <code className="demo-code-inline">open</code>
          {' '}
          to drive visibility from outside. The viewer never flips state on its own — it calls
          {' '}
          <code className="demo-code-inline">onOpenChange</code>
          {' '}
          and waits for your state to change, so your state stays the single source of truth.
          Controlled mode is decided at mount.
        </>
      )}
    >
      <figure className="demo-card demo-stage">
        <button type="button" className="demo-button" onClick={() => setOpen(true)}>
          Open from the outside
        </button>
        <HanaImgViewer
          className="demo-thumb"
          open={open}
          onOpenChange={setOpen}
          src={gardenImg}
          alt="Artwork 129115891"
        />
        <figcaption className="demo-stage__note">
          open:
          {' '}
          {String(open)}
        </figcaption>
      </figure>
      <CodeBlock file="ControlledState.tsx" code={snippet} />
    </DemoSection>
  )
}
