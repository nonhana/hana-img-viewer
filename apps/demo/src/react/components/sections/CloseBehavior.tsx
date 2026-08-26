import { HanaImgViewer } from 'hana-img-viewer-react'
import CodeBlock from '../CodeBlock'
import DemoSection from '../DemoSection'

const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `{/* Backdrop clicks are ignored; press Escape to close */}
<HanaImgViewer closeOnBackdropClick={false} src="/a.png" alt="A" />

{/* Escape is ignored; click the backdrop to close */}
<HanaImgViewer closeOnEscape={false} src="/b.png" alt="B" />`

export default function CloseBehavior() {
  return (
    <DemoSection
      id="close-behavior"
      index="07"
      title="Close behavior"
      apis={['closeOnBackdropClick', 'closeOnEscape']}
      description={(
        <>
          Both escape hatches are opt-out. The left viewer ignores backdrop clicks — press
          Escape instead. The right one ignores Escape — click the backdrop.
        </>
      )}
    >
      <figure className="demo-card demo-stage">
        <span className="demo-stage__row">
          <span className="demo-stage__cell">
            <HanaImgViewer
              className="demo-thumb"
              closeOnBackdropClick={false}
              src={artImg}
              alt="Closes with Escape only"
            />
            <code className="demo-code-inline">closeOnBackdropClick: false</code>
          </span>
          <span className="demo-stage__cell">
            <HanaImgViewer
              className="demo-thumb"
              closeOnEscape={false}
              src={gardenImg}
              alt="Closes with a backdrop click only"
            />
            <code className="demo-code-inline">closeOnEscape: false</code>
          </span>
        </span>
        <figcaption className="demo-stage__note">
          Try the wrong close gesture first — nothing happens.
        </figcaption>
      </figure>
      <CodeBlock file="CloseBehavior.tsx" code={snippet} />
    </DemoSection>
  )
}
