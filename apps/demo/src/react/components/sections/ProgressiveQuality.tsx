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
          <code className="demo-code-inline">src</code>
          {' '}
          light and pass the full-quality file as
          {' '}
          <code className="demo-code-inline">previewSrc</code>
          . The overlay opens instantly with the thumbnail, then swaps in the high-res image
          the moment it finishes loading — no spinner, no layout shift.
        </>
      )}
    >
      <figure className="demo-card demo-stage">
        <HanaImgViewer
          className="demo-thumb"
          src={coverImg}
          previewSrc={artImg}
          alt="Cover that upgrades to a high-res artwork"
        />
        <figcaption className="demo-stage__note">
          Open it and watch the image sharpen in place.
        </figcaption>
      </figure>
      <CodeBlock file="ProgressiveQuality.tsx" code={snippet} />
    </DemoSection>
  )
}
