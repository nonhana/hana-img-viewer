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
          <code className="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">showCloseButton</code>
          . The left viewer ignores backdrop clicks; the middle one ignores Escape; the
          right one hides the close button.
        </>
      )}
    >
      <figure className="m-0 flex flex-col items-center justify-center gap-3.5 rounded-[8px] border border-line-soft bg-surface p-6 shadow-lift">
        <span className="flex w-full flex-wrap justify-center gap-4">
          <span className="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
            <HanaImgViewer
              className="block w-full max-w-[380px]"
              closeOnBackdropClick={false}
              src={artImg}
              alt="Closes with Escape or the close button"
            />
            <code className="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">closeOnBackdropClick: false</code>
          </span>
          <span className="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
            <HanaImgViewer
              className="block w-full max-w-[380px]"
              closeOnEscape={false}
              src={gardenImg}
              alt="Closes with a backdrop click or the close button"
            />
            <code className="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">closeOnEscape: false</code>
          </span>
          <span className="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
            <HanaImgViewer
              className="block w-full max-w-[380px]"
              showCloseButton={false}
              src={artImg}
              alt="Closes with the backdrop or Escape only"
            />
            <code className="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">showCloseButton: false</code>
          </span>
        </span>
        <figcaption className="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
          Try the wrong close gesture first — nothing happens.
        </figcaption>
      </figure>
      <CodeBlock file="CloseBehavior.tsx" code={snippet} />
    </DemoSection>
  )
}
