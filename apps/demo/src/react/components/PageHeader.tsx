import GithubSVG from '../GithubSVG'

export default function PageHeader({ ssr }: { ssr: boolean }) {
  return (
    <header className="
      sticky top-0 z-100 border-b border-line-soft bg-[oklch(0.98_0_0/_0.85)]
      [-webkit-backdrop-filter:blur(8px)]
    "
    >
      <nav
        className="
          mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6
          py-3.5
        "
        aria-label="Demo navigation"
      >
        <a
          className="
            inline-flex items-center gap-2.5 text-ink-strong no-underline
          "
          href="/"
        >
          <strong className="font-serif text-[17px] font-bold">hana-img-viewer</strong>
          <span className="
            inline-block rounded-full border border-hana-blue bg-hana-blue-50
            px-3 py-0.5 font-mono text-[11px] tracking-[0.18em]
            whitespace-nowrap text-hana-blue uppercase
          "
          >
            React
          </span>
          {ssr && (
            <span className="
              inline-block rounded-full border border-line bg-surface px-3
              py-0.5 font-mono text-[11px] tracking-[0.18em] whitespace-nowrap
              text-ink uppercase
            "
            >
              SSR
            </span>
          )}
        </a>
        <span className="inline-flex items-center gap-4.5 font-mono text-[13px]">
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
            href={ssr ? '/vue-ssr.html' : '/vue.html'}
          >
            Vue
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
            href={ssr ? '/react.html' : '/react-ssr.html'}
          >
            {ssr ? 'SPA' : 'SSR'}
          </a>
          <a
            className="
              inline-flex text-ink-strong
              motion-safe:[transition:color_300ms_ease-out]
              motion-safe:hover:text-hana-blue
            "
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
