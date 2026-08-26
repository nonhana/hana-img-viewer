import PageHeader from './components/PageHeader'
import BasicUsage from './components/sections/BasicUsage'
import CloseBehavior from './components/sections/CloseBehavior'
import ControlledState from './components/sections/ControlledState'
import CustomContainer from './components/sections/CustomContainer'
import ProgressiveQuality from './components/sections/ProgressiveQuality'
import ZoomControl from './components/sections/ZoomControl'

// The SSR entries pass true so the prerendered and hydrated DOM stay identical.
export default function App({ ssr = false }: { ssr?: boolean }) {
  return (
    <>
      <PageHeader ssr={ssr} />
      {ssr && (
        <p className="ssr-note">
          <span className="demo-meta">Prerendered at build time · hydrated on load</span>
        </p>
      )}
      <main className="demo-page">
        <BasicUsage />
        <ProgressiveQuality />
        <ControlledState />
        <CustomContainer />
        <ZoomControl />
        <CloseBehavior />
      </main>
      <footer className="demo-footer">
        <a
          className="demo-link"
          href="https://github.com/nonhana/hana-img-viewer"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a className="demo-link" href="/">All demos</a>
        <span className="demo-meta">MIT licensed</span>
      </footer>
    </>
  )
}
