import { HanaImgViewer } from 'hana-img-viewer-react'
import CodeBlock from '../CodeBlock'
import DemoSection from '../DemoSection'

const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `{/* Backdrop clicks are ignored; press Escape or the close button */}
<HanaImgViewer closeOnBackdropClick={false} src="/a.png" alt="A" />

{/* Escape is ignored; click the backdrop or the close button */}
<HanaImgViewer closeOnEscape={false} src="/b.png" alt="B" />

{/* No close button; backdrop and Escape still close */}
<HanaImgViewer showCloseButton={false} src="/c.png" alt="C" />`

export default function CloseBehavior() {
  return (
    <DemoSection
      id="close-behavior"
      index="07"
      title="Close behavior"
      apis={['closeOnBackdropClick', 'closeOnEscape', 'showCloseButton']}
      description={(
        <>
          All three escape hatches are opt-out: backdrop click, Escape, and the corner
          {' '}
          <code className="demo-code-inline">showCloseButton</code>
          . The left viewer ignores backdrop clicks; the middle one ignores Escape; the
          right one hides the close button.
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
              alt="Closes with Escape or the close button"
            />
            <code className="demo-code-inline">closeOnBackdropClick: false</code>
          </span>
          <span className="demo-stage__cell">
            <HanaImgViewer
              className="demo-thumb"
              closeOnEscape={false}
              src={gardenImg}
              alt="Closes with a backdrop click or the close button"
            />
            <code className="demo-code-inline">closeOnEscape: false</code>
          </span>
          <span className="demo-stage__cell">
            <HanaImgViewer
              className="demo-thumb"
              showCloseButton={false}
              src={artImg}
              alt="Closes with the backdrop or Escape only"
            />
            <code className="demo-code-inline">showCloseButton: false</code>
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
