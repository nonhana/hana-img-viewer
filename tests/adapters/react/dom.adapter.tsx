import type { ComponentProps } from 'react'
import type { DomAdapter, DomHandle, DomMountOptions } from '../../contracts/dom/adapter'
import { act, render } from '@testing-library/react'
import HanaImgViewer from '@/index'

const containerFromOptions = (options: DomMountOptions): HTMLElement | null | undefined => {
  if (!options.container || options.container.kind === 'body')
    return undefined
  if (options.container.kind === 'pending')
    return null
  return options.container.element
}

const ReactHarness = ({ options, requests }: { options: DomMountOptions, requests: boolean[] }) => {
  const props: ComponentProps<typeof HanaImgViewer> = {
    src: options.src ?? 'thumb.jpg',
    previewSrc: options.previewSrc,
    alt: options.alt,
    container: containerFromOptions(options),
    minZoom: options.minZoom,
    maxZoom: options.maxZoom,
    closeOnBackdropClick: options.closeOnBackdropClick,
    closeOnEscape: options.closeOnEscape,
    showCloseButton: options.showCloseButton,
    defaultOpen: options.visibility?.kind === 'local' ? options.visibility.initialOpen : undefined,
    open: options.visibility?.kind === 'external' ? options.visibility.open : undefined,
    onOpenChange: (nextOpen) => {
      requests.push(nextOpen)
    },
  }

  return <HanaImgViewer {...props} />
}

class ReactHandle implements DomHandle {
  readonly host: HTMLElement
  readonly requests: boolean[]
  private options: DomMountOptions
  private readonly view: ReturnType<typeof render>

  constructor(options: DomMountOptions) {
    this.options = { visibility: { kind: 'local' }, ...options }
    this.requests = []
    this.host = document.createElement('div')
    document.body.append(this.host)
    this.view = render(<ReactHarness options={this.options} requests={this.requests} />, { container: this.host })
  }

  getOrigin() {
    return this.host.firstElementChild as HTMLElement | null
  }

  getTrigger() {
    return this.host.querySelector<HTMLElement>('.hana-img-viewer-thumbnail')
  }

  getDialog() {
    const target = this.options.container?.kind === 'custom' ? this.options.container.element : document.body
    return target.querySelector<HTMLElement>('[role="dialog"]')
  }

  getBackdrop() {
    return this.getDialog()?.querySelector<HTMLElement>('.hana-img-viewer-backdrop') ?? null
  }

  getPreview() {
    return this.getDialog()?.querySelector<HTMLImageElement>('.hana-img-viewer-preview') ?? null
  }

  getFlipShell() {
    return this.getDialog()?.querySelector<HTMLElement>('.hana-img-viewer-flip-shell') ?? null
  }

  async update(options: Partial<DomMountOptions>) {
    this.options = { ...this.options, ...options }
    await act(async () => {
      this.view.rerender(<ReactHarness options={this.options} requests={this.requests} />)
    })
  }

  async confirmVisibility(open: boolean) {
    if (this.options.visibility?.kind !== 'external')
      throw new Error('confirmVisibility is only available for external ownership')
    this.options = { ...this.options, visibility: { kind: 'external', open } }
    await this.update({})
  }

  async settle() {
    for (let index = 0; index < 10; index++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
      })
    }
  }

  unmount() {
    this.view.unmount()
    this.host.remove()
  }
}

export const reactDomAdapter: DomAdapter = {
  async mount(options = {}) {
    return new ReactHandle(options)
  },
}
