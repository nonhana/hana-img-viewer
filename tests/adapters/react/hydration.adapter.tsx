import type { HydrationAdapter, HydrationResult } from '../../contracts/hydration/adapter'
import { act } from '@testing-library/react'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import HanaImgViewer from '@/index'

export const reactHydrationAdapter: HydrationAdapter = {
  async hydrate(options): Promise<HydrationResult> {
    const tree = (
      <StrictMode>
        <HanaImgViewer src={options.src} open={options.open} />
      </StrictMode>
    )
    const serverHtml = renderToString(tree)
    const host = document.createElement('div')
    host.innerHTML = serverHtml
    document.body.append(host)
    const warnings: string[] = []
    const originalError = console.error
    console.error = (...args: unknown[]) => warnings.push(args.map(String).join(' '))
    const root = hydrateRoot(host, tree)
    const firstSnapshot = host.querySelector<HTMLElement>('.hana-img-viewer-preview')

    return {
      serverHtml,
      firstSnapshot,
      warnings,
      host,
      async settle() {
        for (let index = 0; index < 10; index++) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 20))
          })
        }
      },
      getClientOverlay: () => document.querySelector<HTMLElement>('.hana-img-viewer-overlay'),
      unmount() {
        act(() => root.unmount())
        console.error = originalError
        host.remove()
      },
    }
  },
}
