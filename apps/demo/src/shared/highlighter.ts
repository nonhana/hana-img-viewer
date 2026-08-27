import type { ShikiTransformer } from 'shiki'
import tsx from '@shikijs/langs/tsx'
import ts from '@shikijs/langs/typescript'
import vue from '@shikijs/langs/vue'
import vitesseLight from '@shikijs/themes/vitesse-light'
import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

// Snippets are plain strings in the section components, so a synchronous
// module-level singleton keeps the build-time prerender and the client
// hydration byte-identical with no async gating in any mount entry.
const highlighter = createHighlighterCoreSync({
  themes: [vitesseLight],
  langs: [vue, ts, tsx],
  engine: createJavaScriptRegexEngine(),
})

// The demo containers own code-block styling (Tailwind classes in markup),
// so shiki must not paint its inline theme background over the token colors.
const PRE_CLASSES
  = 'm-0 overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.65] tab-2 text-ink-strong'

const ownPreStyles: ShikiTransformer = {
  name: 'demo-pre-styles',
  pre(node) {
    delete node.properties.style
    node.properties.class = PRE_CLASSES
  },
}

function langForFile(file: string): 'ts' | 'tsx' | 'vue' | 'text' {
  if (file.endsWith('.vue'))
    return 'vue'
  if (file.endsWith('.tsx'))
    return 'tsx'
  if (file.endsWith('.ts'))
    return 'ts'
  // Unknown extensions degrade to escaped plain text.
  return 'text'
}

export function highlightCode(code: string, file: string): string {
  return highlighter.codeToHtml(code, {
    lang: langForFile(file),
    theme: 'vitesse-light',
    transformers: [ownPreStyles],
  })
}
