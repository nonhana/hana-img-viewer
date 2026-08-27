import type { DomAdapter, DomHandle, DomMountOptions } from '../../contracts/dom/adapter'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import HanaImgViewer from '@/index'

const VueHarness = defineComponent({
  props: {
    options: { type: Object, required: true },
    requests: { type: Array, required: true },
  },
  setup(props) {
    const renderViewer = () => {
      const options = props.options as DomMountOptions
      const viewerProps: Record<string, unknown> = {
        'src': options.src ?? 'thumb.jpg',
        'previewSrc': options.previewSrc,
        'alt': options.alt,
        'minZoom': options.minZoom,
        'maxZoom': options.maxZoom,
        'closeOnBackdropClick': options.closeOnBackdropClick,
        'closeOnEscape': options.closeOnEscape,
        'showCloseButton': options.showCloseButton,
        'onUpdate:open': (nextOpen: boolean) => {
          ;(props.requests as boolean[]).push(nextOpen)
        },
      }
      if (options.container?.kind === 'pending')
        viewerProps.container = null
      else if (options.container?.kind === 'custom')
        viewerProps.container = options.container.element
      if (options.visibility?.kind === 'external') {
        viewerProps.open = options.visibility.open
      }
      return h(HanaImgViewer, viewerProps as never)
    }
    return renderViewer
  },
})

class VueHandle implements DomHandle {
  readonly host: HTMLElement
  readonly requests: boolean[]
  private options: DomMountOptions
  private readonly wrapper: ReturnType<typeof mount>

  constructor(options: DomMountOptions) {
    this.options = { visibility: { kind: 'local' }, ...options }
    this.requests = []
    this.host = document.createElement('div')
    document.body.append(this.host)
    this.wrapper = mount(VueHarness, {
      attachTo: this.host,
      props: { options: this.options, requests: this.requests },
    })
  }

  getOrigin() {
    return this.host.querySelector<HTMLElement>('.hana-img-viewer-thumbnail-root')
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
    await this.wrapper.setProps({ options: this.options })
    await flushPromises()
  }

  async confirmVisibility(open: boolean) {
    if (this.options.visibility?.kind !== 'external')
      throw new Error('confirmVisibility is only available for external ownership')
    this.options = { ...this.options, visibility: { kind: 'external', open } }
    await this.update({})
  }

  async settle() {
    for (let index = 0; index < 10; index++) {
      await flushPromises()
      await this.wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 20))
    }
  }

  unmount() {
    this.wrapper.unmount()
    this.host.remove()
  }
}

export const vueDomAdapter: DomAdapter = {
  async mount(options = {}) {
    return new VueHandle(options)
  },
}
