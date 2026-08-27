import { HanaImgViewer } from 'hana-img-viewer-react'
import CodeBlock from '../CodeBlock'
import DemoSection from '../DemoSection'

const coverImg = 'https://grey-flowers-r2.caelum.moe/article-covers/202608/23b4cde2-be1a-47f2-b15a-5abe5dacc3af.jpg'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `{/* Default 300ms open/close FLIP */}
<HanaImgViewer src="/covers/summer.jpg" alt="Cover" />

{/* Longer, smoother open/close animation */}
<HanaImgViewer transitionDuration={600} src="/photos/garden.png" alt="Garden" />`

export default function TransitionDuration() {
  return (
    <DemoSection
      id="transition-duration"
      index="08"
      title="Transition duration"
      apis={['transitionDuration']}
      description={(
        <>
          The open and close FLIP runs for
          {' '}
          <code className="demo-code-inline">transitionDuration</code>
          {' '}
          milliseconds. The left one keeps the default 300 ms; the right one
          stretches the animation to 600 ms.
        </>
      )}
    >
      <figure className="demo-card demo-stage">
        <span className="demo-stage__row">
          <span className="demo-stage__cell">
            <HanaImgViewer
              className="demo-thumb"
              src={coverImg}
              alt="Default 300ms transition"
            />
            <code className="demo-code-inline">default: 300ms</code>
          </span>
          <span className="demo-stage__cell">
            <HanaImgViewer
              className="demo-thumb"
              transitionDuration={600}
              src={gardenImg}
              alt="600ms transition"
            />
            <code className="demo-code-inline">transitionDuration: 600</code>
          </span>
        </span>
        <figcaption className="demo-stage__note">
          Open and close each one — the right viewer animates noticeably slower.
        </figcaption>
      </figure>
      <CodeBlock file="TransitionDuration.tsx" code={snippet} />
    </DemoSection>
  )
}
