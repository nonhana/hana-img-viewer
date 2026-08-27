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
          <code className="
            rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
            text-ink-strong
          "
          >
            transitionDuration
          </code>
          {' '}
          milliseconds. The left one keeps the default 300 ms; the right one
          stretches the animation to 600 ms.
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
              alt="Default 300ms transition"
            />
            <code className="
              rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
              text-ink-strong
            "
            >
              default: 300ms
            </code>
          </span>
          <span className="
            flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5
          "
          >
            <HanaImgViewer
              className="block w-full max-w-95"
              transitionDuration={600}
              src={gardenImg}
              alt="600ms transition"
            />
            <code className="
              rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
              text-ink-strong
            "
            >
              transitionDuration: 600
            </code>
          </span>
        </span>
        <figcaption className="
          m-0 text-center font-mono text-xs tracking-[0.02em] text-ink
        "
        >
          Open and close each one — the right viewer animates noticeably slower.
        </figcaption>
      </figure>
      <CodeBlock file="TransitionDuration.tsx" code={snippet} />
    </DemoSection>
  )
}
