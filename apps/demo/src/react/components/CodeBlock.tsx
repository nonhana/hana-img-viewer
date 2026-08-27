import { useEffect, useRef, useState } from 'react'

export default function CodeBlock({ file, code }: { file: string, code: string }) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(setCopied, 1600, false)
    }
    catch {
      // Clipboard access denied; leave the button label unchanged.
    }
  }

  return (
    <figure className="
      m-0 overflow-hidden rounded-lg border-2 border-primary-400 bg-primary-100
    "
    >
      <figcaption className="
        flex items-center justify-between gap-3 border-b border-line-soft px-3
        py-1.5
      "
      >
        <span className="font-mono text-[11px] tracking-[0.18em] text-ink uppercase">{file}</span>
        <button
          type="button"
          className="
            cursor-pointer rounded-full border border-line bg-surface px-2.5
            py-0.5 font-mono text-[11px] tracking-[0.08em] text-ink
            motion-safe:[transition:background-color_300ms_ease-out,color_300ms_ease-out,border-color_300ms_ease-out]
            motion-safe:hover:border-hana-blue-150
            motion-safe:hover:bg-hana-blue-150 motion-safe:hover:text-hana-blue
          "
          onClick={copy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="
        m-0 overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.65]
        tab-2 text-ink-strong
      "
      >
        <code>{code}</code>
      </pre>
    </figure>
  )
}
