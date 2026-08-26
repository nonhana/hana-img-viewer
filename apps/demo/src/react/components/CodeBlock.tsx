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
    <figure className="code-block">
      <figcaption className="code-block__bar">
        <span className="code-block__file">{file}</span>
        <button type="button" className="code-block__copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="code-block__body"><code>{code}</code></pre>
    </figure>
  )
}
