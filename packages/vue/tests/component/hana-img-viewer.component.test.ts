import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { HanaImgViewer } from '@/index'
import {
  getAnimationCalls,
  getImageRequestCount,
  getPendingAnimationCount,
  resolvePendingAnimation,
  resolvePendingImage,
  setAnimationSequence,
  setElementRect,
  setImageSequence,
  setSelectorClientSize,
  setSelectorRect,
  triggerResizeObservers,
} from '../setup/component.setup'
import { describe, expect, it, vi } from '../support/vitest'

const settle = async (): Promise<void> => {
  await nextTick()
  await flushPromises()
  await nextTick()
}

const nextFrame = async (): Promise<void> => {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

const dispatchPointer = (element: HTMLElement, type: string, pointerId: number, clientX: number, clientY: number) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    clientY: { value: clientY },
  })
  element.dispatchEvent(event)
}

const dispatchTouches = (element: HTMLElement, type: string, points: Array<{ clientX: number, clientY: number }>) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', {
    value: Object.assign([...points], { length: points.length }),
  })
  element.dispatchEvent(event)
}

describe('HanaImgViewer public behavior', () => {
  it('[behavior/B1] renders thumbnail-only markup until opened', async () => {
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg', alt: 'Thumbnail' } })
    expect(wrapper.get('.hana-img-viewer-thumbnail').attributes('src')).toBe('/thumb.jpg')
    expect(document.body.querySelector('.hana-img-viewer-preview')).toBeNull()

    await wrapper.get('.hana-img-viewer-thumbnail').trigger('click')
    await settle()
    expect(document.body.querySelector('.hana-img-viewer-preview')).not.toBeNull()
    wrapper.unmount()
  })

  it('[behavior/B2] uses local ownership when only update listener is present', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', ...{ 'onUpdate:open': onUpdate } },
    })
    await wrapper.get('img').trigger('click')
    await settle()
    expect(document.body.querySelector('.hana-img-viewer-preview')).not.toBeNull()
    expect(onUpdate).toHaveBeenCalledWith(true)
    wrapper.unmount()
  })

  it('[behavior/B2] waits for controlled owner acknowledgement', async () => {
    const open = ref(true)
    const Host = defineComponent({
      setup() {
        return () => h(HanaImgViewer, {
          src: '/thumb.jpg',
          open: open.value,
          ...{
            'onUpdate:open': (value: boolean) => {
              open.value = value
            },
          },
        })
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await settle()
    expect(document.body.querySelector('.hana-img-viewer-preview')).not.toBeNull()
    document.body.querySelector('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    expect(open.value).toBe(false)
    expect(document.body.querySelector('.hana-img-viewer-preview')).toBeNull()
    wrapper.unmount()
  })

  it('[behavior/B3] zooms around a wheel event anchor', async () => {
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg' } })
    await wrapper.get('img').trigger('click')
    await settle()
    const preview = document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement
    preview.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: 10, clientY: 10, deltaY: -100 }))
    await nextFrame()
    expect(preview.style.transform).toContain('scale(1.2)')
    wrapper.unmount()
  })

  it('[behavior/B4] gives pinch the sole gesture ownership', async () => {
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg' } })
    await wrapper.get('img').trigger('click')
    await settle()
    const preview = document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement
    dispatchPointer(preview, 'pointerdown', 1, 0, 0)
    dispatchTouches(preview, 'touchstart', [{ clientX: 0, clientY: 0 }, { clientX: 10, clientY: 0 }])
    dispatchTouches(preview, 'touchmove', [{ clientX: 0, clientY: 0 }, { clientX: 20, clientY: 0 }])
    await nextFrame()
    expect(preview.style.transform).toContain('scale(2)')
    wrapper.unmount()
  })

  it('[behavior/B5] drags at baseline scale and cleans the owner on close', async () => {
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg' } })
    await wrapper.get('img').trigger('click')
    await settle()
    const preview = document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement
    dispatchPointer(preview, 'pointerdown', 1, 10, 10)
    dispatchPointer(preview, 'pointermove', 1, 30, 35)
    await nextFrame()
    expect(preview.style.transform).toContain('translate3d(20px, 25px')
    preview.closest('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    expect(document.body.querySelector('.hana-img-viewer-preview')).toBeNull()
    wrapper.unmount()
  })

  it('[behavior/B5] preserves an active drag across open-state remeasurement', async () => {
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg' } })
    await wrapper.get('img').trigger('click')
    await settle()
    const preview = document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement

    dispatchPointer(preview, 'pointerdown', 1, 0, 0)
    dispatchPointer(preview, 'pointermove', 1, 10, 10)
    await nextFrame()
    expect(preview.style.transform).toContain('translate3d(10px, 10px')

    const overlay = document.body.querySelector('.hana-img-viewer-overlay') as HTMLElement
    setElementRect(overlay, { width: 800, height: 600 })
    window.dispatchEvent(new Event('resize'))
    await nextFrame()
    await settle()

    dispatchPointer(preview, 'pointermove', 1, 20, 20)
    await nextFrame()
    expect(preview.style.transform).toContain('translate3d(20px, 20px')
    wrapper.unmount()
  })

  it('[behavior/B6] toggles double-click zoom between baseline and 2x', async () => {
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg' } })
    await wrapper.get('img').trigger('click')
    await settle()
    const preview = document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement
    preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }))
    await nextFrame()
    expect(preview.style.transform).toContain('scale(2)')
    preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }))
    await nextFrame()
    expect(preview.style.transform).toContain('scale(1)')
    wrapper.unmount()
  })

  it('[behavior/B7] continues an opening animation from its current visual state after remeasurement', async () => {
    let now = 100
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    setSelectorRect('.hana-img-viewer-thumbnail-root', { x: 10, y: 20, width: 100, height: 80 })
    setSelectorRect('.hana-img-viewer-flip-shell', { x: 100, y: 120, width: 800, height: 600 })
    setSelectorClientSize('.hana-img-viewer-overlay', { width: 640, height: 480 })
    setAnimationSequence(['pending', 'pending', 'pending', 'pending'])
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', open: true },
    })
    await settle()
    expect(getPendingAnimationCount()).toBe(2)

    const shell = document.body.querySelector('.hana-img-viewer-flip-shell') as HTMLElement
    shell.style.transform = 'matrix(1, 0, 0, 1, 10, 20)'
    now = 350
    setSelectorClientSize('.hana-img-viewer-overlay', { width: 800, height: 600 })
    triggerResizeObservers()
    await nextFrame()
    await nextTick()

    const shellCalls = getAnimationCalls().filter(call =>
      call.element.classList.contains('hana-img-viewer-flip-shell'),
    )
    expect(shellCalls).toHaveLength(2)
    expect(shellCalls[0].keyframes[0]?.transform).toContain('scale(0.125')
    expect(shellCalls[1].keyframes[0]?.transform).toBe('matrix(1, 0, 0, 1, 10, 20)')
    expect(shellCalls[1].options.duration).toBe(50)
    wrapper.unmount()
  })

  it('[behavior/B2/B7] preserves zoom and pan when a reversed opening remeasures', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', open: true },
    })
    await settle()
    const preview = document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement
    preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }))
    await nextFrame()
    expect(preview.style.transform).toContain('scale(2)')

    setAnimationSequence(['pending', 'pending', 'pending', 'pending', 'pending', 'pending'])
    await wrapper.setProps({ open: false })
    await nextTick()
    expect(getPendingAnimationCount()).toBe(2)
    await wrapper.setProps({ open: true })
    await nextTick()
    expect(getPendingAnimationCount()).toBe(2)

    const shell = document.body.querySelector('.hana-img-viewer-flip-shell') as HTMLElement
    shell.style.transform = 'matrix(1, 0, 0, 1, 10, 20)'
    setSelectorClientSize('.hana-img-viewer-overlay', { width: 800, height: 600 })
    triggerResizeObservers()
    await nextFrame()
    await nextTick()

    const shellCalls = getAnimationCalls().filter(call =>
      call.element.classList.contains('hana-img-viewer-flip-shell'),
    )
    expect(shellCalls).toHaveLength(4)
    expect(shellCalls[2].keyframes[1]?.transform).toContain('scale(2)')
    expect(shellCalls[3].keyframes[1]?.transform).toContain('scale(2)')
    wrapper.unmount()
  })

  it('[interface/Vue] disables every transform gesture when enableZoom is false', async () => {
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg', enableZoom: false } })
    await wrapper.get('img').trigger('click')
    await settle()
    const preview = document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement
    const initialTransform = preview.style.transform
    preview.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 }))
    preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
    dispatchPointer(preview, 'pointerdown', 1, 0, 0)
    dispatchPointer(preview, 'pointermove', 1, 20, 20)
    await nextFrame()
    expect(preview.style.transform).toBe(initialTransform)
    wrapper.unmount()
  })

  it('[interface/Vue] clamps configured zoom bounds without resetting drag translation', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', minZoom: 0.8, maxZoom: 1.1 },
    })
    await wrapper.get('img').trigger('click')
    await settle()
    const preview = document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement

    preview.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: 10, clientY: 10, deltaY: 1000 }))
    await nextFrame()
    expect(preview.style.transform).toContain('scale(0.8)')

    dispatchPointer(preview, 'pointerdown', 1, 10, 10)
    dispatchPointer(preview, 'pointermove', 1, 30, 35)
    dispatchPointer(preview, 'pointerup', 1, 30, 35)
    await nextFrame()
    expect(preview.style.transform).toContain('translate3d(')
    expect(preview.style.transform).not.toContain('translate3d(0px, 0px')

    preview.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: 10, clientY: 10, deltaY: -1000 }))
    await nextFrame()
    expect(preview.style.transform).toContain('scale(1.1)')

    dispatchPointer(preview, 'pointerdown', 1, 10, 10)
    dispatchPointer(preview, 'pointermove', 1, 30, 35)
    await nextFrame()
    const transformBeforeBoundUpdate = preview.style.transform
    await wrapper.setProps({ maxZoom: 0.9 })
    await nextFrame()
    expect(preview.style.transform).toBe(transformBeforeBoundUpdate.replace('scale(1.1)', 'scale(0.9)'))
    wrapper.unmount()
  })

  it('[interface/Vue] leaves backdrop and Escape dismissal to the host when disabled', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', closeOnBackdropClick: false, closeOnEscape: false },
    })
    await wrapper.get('img').trigger('click')
    await settle()

    document.body.querySelector('.hana-img-viewer-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    document.body.querySelector('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    expect(document.body.querySelector('.hana-img-viewer-preview')).not.toBeNull()
    wrapper.unmount()
  })

  it('[behavior/B8-B9] upgrades silently and retries in a new session', async () => {
    setImageSequence('/preview.jpg', ['error', 'load'])
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', previewSrc: '/preview.jpg' },
    })
    await wrapper.get('img').trigger('click')
    await settle()
    await settle()
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/thumb.jpg')
    expect(getImageRequestCount('/preview.jpg')).toBe(1)

    document.body.querySelector('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    await wrapper.get('img').trigger('click')
    await settle()
    expect(getImageRequestCount('/preview.jpg')).toBe(2)
    await settle()
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/preview.jpg')
    wrapper.unmount()
  })

  it('[behavior/B8/B9] returns to the base when previewSrc is removed or its replacement fails', async () => {
    setImageSequence('/first-preview.jpg', ['load'])
    setImageSequence('/failed-preview.jpg', ['error'])
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', previewSrc: '/first-preview.jpg', open: true },
    })
    await settle()
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/first-preview.jpg')

    await wrapper.setProps({ previewSrc: undefined })
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/thumb.jpg')

    await wrapper.setProps({ previewSrc: '/failed-preview.jpg' })
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/thumb.jpg')
    await settle()
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/thumb.jpg')
    wrapper.unmount()
  })

  it('[behavior/B8] ignores stale enhancement completion and remeasures a replacement thumbnail', async () => {
    setImageSequence('/first-preview.jpg', ['pending'])
    setImageSequence('/second-preview.jpg', ['pending'])
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/first.jpg', previewSrc: '/first-preview.jpg', open: true },
    })
    await settle()

    await wrapper.setProps({ src: '/second.jpg', previewSrc: '/second-preview.jpg' })
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/second.jpg')

    resolvePendingImage('/first-preview.jpg')
    await settle()
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/second.jpg')

    resolvePendingImage('/second-preview.jpg')
    await settle()
    expect((document.body.querySelector('.hana-img-viewer-preview') as HTMLImageElement).src).toContain('/second-preview.jpg')

    const thumbnail = wrapper.get('.hana-img-viewer-thumbnail')
    Object.defineProperties(thumbnail.element, {
      naturalHeight: { configurable: true, value: 500 },
      naturalWidth: { configurable: true, value: 1000 },
    })
    await thumbnail.trigger('load')
    await nextFrame()
    expect((document.body.querySelector('.hana-img-viewer-flip-shell') as HTMLElement).style.height).toBe('460.8px')
    wrapper.unmount()
  })

  it('[behavior/B10] restores the focused trigger and scopes Escape to the focused body overlay', async () => {
    const first = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/one.jpg' } })
    const second = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/two.jpg' } })
    await first.get('img').trigger('click')
    await settle()
    await second.get('img').trigger('click')
    await settle()
    const secondPreview = document.body.querySelectorAll('.hana-img-viewer-preview')[1] as HTMLElement
    secondPreview.closest('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    expect(document.body.querySelectorAll('.hana-img-viewer-preview')).toHaveLength(1)
    expect(document.activeElement).toBe(second.get('img').element)
    first.unmount()
    second.unmount()
  })

  it('[behavior/B10] restores the exact focused element from custom trigger content', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg' },
      slots: {
        thumbnail: ({ open }: { open: () => void }) => [
          h('button', { type: 'button' }, 'Other action'),
          h('button', { type: 'button', onClick: open }, 'Open preview'),
        ],
      },
    })
    const buttons = wrapper.findAll('button')
    const opener = buttons[1]
    ;(opener.element as HTMLButtonElement).focus()
    await opener.trigger('click')
    await settle()

    document.body.querySelector('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()

    expect(document.activeElement).toBe(opener.element)
    wrapper.unmount()
  })

  it('[behavior/B11] keeps thumbnail visible while a null container is pending', async () => {
    const host = document.createElement('section')
    document.body.append(host)
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg', container: null } })
    await wrapper.get('img').trigger('click')
    await settle()
    expect(wrapper.get('img').isVisible()).toBe(true)
    expect(document.body.querySelector('.hana-img-viewer-preview')).toBeNull()

    await wrapper.setProps({ container: host })
    await settle()
    expect(host.querySelector('.hana-img-viewer-preview')).not.toBeNull()
    wrapper.unmount()
  })

  it('[behavior/B11] closes the old container before moving through body, custom, and null targets', async () => {
    const host = document.createElement('section')
    document.body.append(host)
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', open: true },
    })
    await settle()
    expect((document.querySelector('[role="dialog"]') as HTMLElement).parentElement).toBe(document.body)
    expect(document.body.style.overflow).toBe('hidden')

    setAnimationSequence(['pending', 'pending'])
    await wrapper.setProps({ container: host })
    await nextTick()
    expect(getPendingAnimationCount()).toBe(2)
    expect((document.querySelector('[role="dialog"]') as HTMLElement).parentElement).toBe(document.body)
    expect(host.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('hidden')

    resolvePendingAnimation()
    resolvePendingAnimation()
    await settle()
    expect((host.querySelector('[role="dialog"]') as HTMLElement).parentElement).toBe(host)
    expect(document.body.style.overflow).toBe('')

    setAnimationSequence(['pending', 'pending'])
    await wrapper.setProps({ container: null })
    await nextTick()
    expect(getPendingAnimationCount()).toBe(2)
    expect(host.querySelector('[role="dialog"]')).not.toBeNull()

    resolvePendingAnimation()
    resolvePendingAnimation()
    await settle()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(wrapper.get('img').isVisible()).toBe(true)
    wrapper.unmount()
  })

  it('[behavior/B3/B11] measures and anchors zoom in the active custom container', async () => {
    const host = document.createElement('section')
    document.body.append(host)
    setSelectorClientSize('.hana-img-viewer-overlay', { width: 800, height: 600 })
    setSelectorRect('.hana-img-viewer-flip-shell', { x: 120, y: 80, width: 360, height: 270 })
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: { src: '/thumb.jpg', container: host, open: true },
    })
    await settle()
    const shell = host.querySelector('.hana-img-viewer-flip-shell') as HTMLElement
    expect(shell.style.width).toBe('720px')
    expect(shell.style.height).toBe('540px')

    setSelectorClientSize('.hana-img-viewer-overlay', { width: 600, height: 400 })
    triggerResizeObservers()
    await nextFrame()
    await settle()
    expect(shell.style.width).toBe('480px')
    expect(shell.style.height).toBe('360px')

    const preview = host.querySelector('.hana-img-viewer-preview') as HTMLImageElement
    preview.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: 300,
      clientY: 215,
      deltaMode: 1,
      deltaY: -100,
    }))
    await nextFrame()
    expect(preview.style.transform).toBe('translate3d(0px, 0px, 0) scale(1.2)')
    wrapper.unmount()
  })

  it('[behavior/B12] preserves host body writes after the final owner closes', async () => {
    const first = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/one.jpg' } })
    const second = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/two.jpg' } })
    await first.get('img').trigger('click')
    await second.get('img').trigger('click')
    await settle()
    document.body.style.overflow = 'scroll'
    first.unmount()
    expect(document.body.style.overflow).toBe('scroll')
    second.unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('[behavior/B13] leaves SSR hydration ownership to the client mount', async () => {
    const wrapper = mount(HanaImgViewer, { props: { src: '/thumb.jpg', open: true } })
    expect(wrapper.get('img')).toBeTruthy()
    await settle()
    expect(document.body.querySelector('.hana-img-viewer-preview')).not.toBeNull()
    wrapper.unmount()
  })
})
