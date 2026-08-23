import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { HanaImgViewer } from '@/index'
import { getImageRequestCount, setImageSequence } from '../setup/component.setup'
import { describe, expect, it, vi } from '../support/vitest'

const settle = async (): Promise<void> => {
  await nextTick()
  await flushPromises()
  await nextTick()
}

const nextFrame = async (): Promise<void> => {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

const dispatchPointer = (element: HTMLElement, type: string, pointerId: number, clientX: number, clientY: number): void => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    clientY: { value: clientY },
  })
  element.dispatchEvent(event)
}

const dispatchTouches = (element: HTMLElement, type: string, points: Array<{ clientX: number, clientY: number }>): void => {
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

  it('[behavior/B11] keeps thumbnail visible while a null container is pending', async () => {
    const wrapper = mount(HanaImgViewer, { attachTo: document.body, props: { src: '/thumb.jpg', container: null } })
    await wrapper.get('img').trigger('click')
    await settle()
    expect(wrapper.get('img').isVisible()).toBe(true)
    expect(document.body.querySelector('.hana-img-viewer-preview')).toBeNull()
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
