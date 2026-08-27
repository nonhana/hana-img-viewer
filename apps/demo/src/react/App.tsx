import PageHeader from './components/PageHeader'
import BasicUsage from './components/sections/BasicUsage'
import CloseBehavior from './components/sections/CloseBehavior'
import ControlledState from './components/sections/ControlledState'
import CustomContainer from './components/sections/CustomContainer'
import ProgressiveQuality from './components/sections/ProgressiveQuality'
import TransitionDuration from './components/sections/TransitionDuration'
import ZoomControl from './components/sections/ZoomControl'

// The SSR entries pass true so the prerendered and hydrated DOM stay identical.
export default function App({ ssr = false }: { ssr?: boolean }) {
  return (
    <>
      <PageHeader ssr={ssr} />
      {ssr && (
        <p className="
          border-b border-line-soft bg-hana-blue-50 px-6 py-1.5 text-center
        "
        >
          <span className="
            font-mono text-[11px] tracking-[0.18em] text-ink uppercase
          "
          >
            Prerendered at build time · hydrated on load
          </span>
        </p>
      )}
      <main className="mx-auto flex max-w-5xl flex-col gap-18 px-6 pt-14 pb-20">
        <BasicUsage />
        <ProgressiveQuality />
        <ControlledState />
        <CustomContainer />
        <ZoomControl />
        <CloseBehavior />
        <TransitionDuration />
      </main>
      <footer className="
        mx-auto flex max-w-5xl items-baseline gap-5 border-t border-line-soft
        px-6 pt-7 pb-14 text-[14px]
      "
      >
        <a
          className="
            cursor-pointer
            bg-[linear-gradient(to_right,var(--color-hana-blue),var(--color-hana-blue))]
            bg-size-[0%_2px] bg-bottom-right bg-no-repeat text-hana-blue
            no-underline
            motion-safe:[transition:background-size_500ms_ease-out]
            motion-safe:hover:bg-size-[100%_2px]
            motion-safe:hover:bg-bottom-left
          "
          href="https://github.com/nonhana/hana-img-viewer"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a
          className="
            cursor-pointer
            bg-[linear-gradient(to_right,var(--color-hana-blue),var(--color-hana-blue))]
            bg-size-[0%_2px] bg-bottom-right bg-no-repeat text-hana-blue
            no-underline
            motion-safe:[transition:background-size_500ms_ease-out]
            motion-safe:hover:bg-size-[100%_2px]
            motion-safe:hover:bg-bottom-left
          "
          href="/"
        >
          All demos
        </a>
        <span className="font-mono text-[11px] tracking-[0.18em] text-ink uppercase">MIT licensed</span>
      </footer>
    </>
  )
}
