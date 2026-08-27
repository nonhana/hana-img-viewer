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
          <code className="
            rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
            text-ink-strong
          "
          >
            minZoom
          </code>
          {' '}
          and
          {' '}
          <code className="
            rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
            text-ink-strong
          "
          >
            maxZoom
          </code>
          .
        </>
      )}
    >
      <figure className="
        m-0 flex flex-col items-center justify-center gap-3.5 rounded-lg border
        border-line-soft bg-surface p-6 shadow-lift
      "
      >
        <span className="flex w-full flex-wrap justify-center gap-4">
          <span className="
            flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5
          "
          >
            <HanaImgViewer
              className="block w-full max-w-95"
              src={coverImg}
              alt="Default zoom range"
            />
            <code className="
              rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
              text-ink-strong
            "
            >
              default: 0.5x &middot; 10x
            </code>
          </span>
          <span className="
            flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5
          "
          >
            <HanaImgViewer
              className="block w-full max-w-95"
              minZoom={1}
              maxZoom={3}
              src={gardenImg}
              alt="Zoom clamped between 1x and 3x"
            />
            <code className="
              rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
              text-ink-strong
            "
            >
              minZoom: 1 · maxZoom: 3
            </code>
          </span>
        </span>
        <figcaption className="
          m-0 text-center font-mono text-xs tracking-[0.02em] text-ink
        "
        >
          Open each one and try the scroll wheel or a double-click.
        </figcaption>
      </figure>
      <CodeBlock file="ZoomControl.tsx" code={snippet} />
    </DemoSection>
  )
}
