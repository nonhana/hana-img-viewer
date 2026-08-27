import { HanaImgViewer } from 'hana-img-viewer-react'
import CodeBlock from '../CodeBlock'
import DemoSection from '../DemoSection'

const coverImg = 'https://grey-flowers-r2.caelum.moe/article-covers/202608/23b4cde2-be1a-47f2-b15a-5abe5dacc3af.jpg'
const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'

const snippet = `import { HanaImgViewer } from 'hana-img-viewer-react'

const thumb = '/covers/summer-320w.jpg'
const fullRes = '/covers/summer-2400w.png'

export default function Example() {
  return <HanaImgViewer src={thumb} previewSrc={fullRes} alt="Summer cover" />
}`

export default function ProgressiveQuality() {
  return (
    <DemoSection
      id="progressive-quality"
      index="02"
      title="Progressive quality"
      apis={['previewSrc']}
      description={(
        <>
          Keep
          {' '}
          <code className="
            rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
            text-ink-strong
          "
          >
            src
          </code>
          {' '}
          light and pass the full-quality file as
          {' '}
          <code className="
            rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
            text-ink-strong
          "
          >
            previewSrc
          </code>
          . The overlay opens instantly with the thumbnail, then swaps in the high-res image
          the moment it finishes loading — no spinner, no layout shift.
        </>
      )}
    >
      <figure className="
        m-0 flex flex-col items-center justify-center gap-3.5 rounded-lg border
        border-line-soft bg-surface p-6 shadow-lift
      "
      >
        <HanaImgViewer
          className="block w-full max-w-95"
          src={coverImg}
          previewSrc={artImg}
          alt="Cover that upgrades to a high-res artwork"
        />
        <figcaption className="
          m-0 text-center font-mono text-xs tracking-[0.02em] text-ink
        "
        >
          Open it and watch the image sharpen in place.
        </figcaption>
      </figure>
      <CodeBlock file="ProgressiveQuality.tsx" code={snippet} />
    </DemoSection>
  )
}
