import GithubSVG from '../GithubSVG'

/**
 * Rendered before the hero thumbnail, so it must not emit any </div>:
 * the dist verifier captures #app content up to the first closing div
 * and requires an <img> inside it. Stick to header/nav/a/span/strong.
 */
export default function PageHeader({ ssr }: { ssr: boolean }) {
  return (
    <header className="page-header">
      <nav className="page-header__nav" aria-label="Demo navigation">
        <a className="page-header__brand" href="/">
          <strong className="page-header__name">hana-img-viewer</strong>
          <span className="demo-badge demo-badge--accent">React</span>
          {ssr && <span className="demo-badge">SSR</span>}
        </a>
        <span className="page-header__links">
          <a className="demo-link" href={ssr ? '/vue-ssr.html' : '/vue.html'}>Vue</a>
          <a className="demo-link" href={ssr ? '/react.html' : '/react-ssr.html'}>
            {ssr ? 'SPA' : 'SSR'}
          </a>
          <a
            className="page-header__github"
            href="https://github.com/nonhana/hana-img-viewer"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <GithubSVG />
          </a>
        </span>
      </nav>
    </header>
  )
}
