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
          <code className="demo-code-inline">src</code>
          {' '}
          at an image and the thumbnail becomes a full viewer: click it to open, scroll or
          double-click to zoom, pinch on touch, drag to pan. Escape or a backdrop click closes
          it again.
        </>
      )}
    >
      <figure className="demo-card demo-stage">
        <HanaImgViewer className="demo-thumb" src={artImg} alt="Artwork 121909597" />
        <figcaption className="demo-stage__note">
          Click the artwork to open the viewer.
        </figcaption>
      </figure>
      <CodeBlock file="BasicUsage.tsx" code={snippet} />
    </DemoSection>
  )
}
