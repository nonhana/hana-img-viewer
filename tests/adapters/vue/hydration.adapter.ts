import type { HydrationAdapter, HydrationResult } from '../../contracts/hydration/adapter'
import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { HanaImgViewer } from '@/index'

type HydrationOptions = Parameters<HydrationAdapter['hydrate']>[0]
interface VueHydrationOptions extends HydrationOptions {
  as?: keyof HTMLElementTagNameMap
  parentTag?: 'p'
}

const hydrate = async (options: VueHydrationOptions): Promise<HydrationResult> => {
  const viewer = () => h(HanaImgViewer, { src: options.src, open: options.open, as: options.as })
  const Root = {
    render: () => options.parentTag ? h(options.parentTag, [viewer()]) : viewer(),
  }
  const serverHtml = await renderToString(createSSRApp(Root))
  const host = document.createElement('div')
  host.innerHTML = serverHtml
  document.body.append(host)
  const warnings: string[] = []
  const originalWarn = console.warn
  const originalError = console.error
  console.warn = (...args: unknown[]) => warnings.push(args.map(String).join(' '))
  console.error = (...args: unknown[]) => warnings.push(args.map(String).join(' '))
  const app = createSSRApp(Root)
  app.mount(host, true)
  const firstSnapshot = host.querySelector<HTMLElement>('.hana-img-viewer-preview')

  return {
    serverHtml,
    firstSnapshot,
    warnings,
    host,
    async settle() {
      for (let index = 0; index < 10; index++) {
        await flushPromises()
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    },
    getClientOverlay: () => document.querySelector<HTMLElement>('.hana-img-viewer-overlay'),
    unmount() {
      app.unmount()
      console.warn = originalWarn
      console.error = originalError
      host.remove()
    },
  }
}

export const hydrateVueInParagraph = (options: HydrationOptions): Promise<HydrationResult> => hydrate({
  ...options,
  as: 'span',
  parentTag: 'p',
})

export const vueHydrationAdapter: HydrationAdapter = {
  hydrate,
}
