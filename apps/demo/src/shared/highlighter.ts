import type { ShikiTransformer } from 'shiki'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

const highlighterPromise = createHighlighterCore({
  themes: [import('@shikijs/themes/vitesse-light')],
  langs: [
    import('@shikijs/langs/vue'),
    import('@shikijs/langs/typescript'),
    import('@shikijs/langs/tsx'),
  ],
  engine: createJavaScriptRegexEngine(),
})

const ownPreStyles: ShikiTransformer = {
  name: 'demo-pre-styles',
  pre(node) {
    delete node.properties.style
    node.properties.class = 'm-0 overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.65] tab-2 text-ink-strong'
  },
}

function langForFile(file: string): 'ts' | 'tsx' | 'vue' | 'text' {
  if (file.endsWith('.vue'))
    return 'vue'
  if (file.endsWith('.tsx'))
    return 'tsx'
  if (file.endsWith('.ts'))
    return 'ts'
  return 'text'
}

export async function highlightCode(code: string, file: string): Promise<string> {
  const highlighter = await highlighterPromise
  return highlighter.codeToHtml(code, {
    lang: langForFile(file),
    theme: 'vitesse-light',
    transformers: [ownPreStyles],
  })
}
