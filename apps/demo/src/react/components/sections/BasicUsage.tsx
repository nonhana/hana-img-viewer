import { HanaImgViewer } from 'hana-img-viewer-react'
import CodeBlock from '../CodeBlock'
import DemoSection from '../DemoSection'

const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'

const snippet = `import { HanaImgViewer } from 'hana-img-viewer-react'

export default function Example() {
  return (
    <HanaImgViewer
      src="https://pixiv-r2.caelum.moe/121909597.png"
      alt="Artwork 121909597"
    />
  )
}`

export default function BasicUsage() {
  return (
    <DemoSection
      id="basic-usage"
      index="01"
      title="Basic usage"
      apis={['src', 'alt']}
      description={(
        <>
          Point
          {' '}
          <code className="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">src</code>
          {' '}
          at an image and the thumbnail becomes a full viewer: click it to open, scroll or
          double-click to zoom, pinch on touch, drag to pan. Escape or a backdrop click closes
          it again.
        </>
      )}
    >
      <figure className="m-0 flex flex-col items-center justify-center gap-3.5 rounded-[8px] border border-line-soft bg-surface p-6 shadow-lift">
        <HanaImgViewer className="block w-full max-w-[380px]" src={artImg} alt="Artwork 121909597" />
        <figcaption className="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
          Click the artwork to open the viewer.
        </figcaption>
      </figure>
      <CodeBlock file="BasicUsage.tsx" code={snippet} />
    </DemoSection>
  )
}
