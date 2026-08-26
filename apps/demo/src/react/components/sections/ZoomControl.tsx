import { HanaImgViewer } from 'hana-img-viewer-react'
import CodeBlock from '../CodeBlock'
import DemoSection from '../DemoSection'

const coverImg = 'https://grey-flowers-r2.caelum.moe/article-covers/202608/23b4cde2-be1a-47f2-b15a-5abe5dacc3af.jpg'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `{/* Default 0.5x-10x zoom */}
<HanaImgViewer src="/covers/summer.jpg" alt="Cover" />

{/* Wheel, pinch, and double-click clamped to 1x-3x */}
<HanaImgViewer minZoom={1} maxZoom={3} src="/photos/garden.png" alt="Garden" />`

export default function ZoomControl() {
  return (
    <DemoSection
      id="zoom-control"
      index="06"
      title="Zoom control"
      apis={['minZoom', 'maxZoom']}
      description={(
        <>
          Zoom is always on. Clamp the wheel, pinch, and double-click range with
          {' '}
          <code className="demo-code-inline">minZoom</code>
          {' '}
          and
          {' '}
          <code className="demo-code-inline">maxZoom</code>
          .
        </>
      )}
    >
      <figure className="demo-card demo-stage">
        <span className="demo-stage__row">
          <span className="demo-stage__cell">
            <HanaImgViewer
              className="demo-thumb"
              src={coverImg}
              alt="Default zoom range"
            />
            <code className="demo-code-inline">default: 0.5x &middot; 10x</code>
          </span>
          <span className="demo-stage__cell">
            <HanaImgViewer
              className="demo-thumb"
              minZoom={1}
              maxZoom={3}
              src={gardenImg}
              alt="Zoom clamped between 1x and 3x"
            />
            <code className="demo-code-inline">minZoom: 1 · maxZoom: 3</code>
          </span>
        </span>
        <figcaption className="demo-stage__note">
          Open each one and try the scroll wheel or a double-click.
        </figcaption>
      </figure>
      <CodeBlock file="ZoomControl.tsx" code={snippet} />
    </DemoSection>
  )
}