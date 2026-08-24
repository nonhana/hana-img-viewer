export interface HydrationResult {
  readonly serverHtml: string
  readonly firstSnapshot: HTMLElement | null
  readonly warnings: readonly string[]
  readonly host: HTMLElement
  settle: () => Promise<void>
  getClientOverlay: () => HTMLElement | null
  unmount: () => void
}

export interface HydrationAdapter {
  hydrate: (options: { src: string, open: boolean }) => Promise<HydrationResult>
}
