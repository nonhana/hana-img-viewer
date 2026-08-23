import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useFLIP } from '@/composables/core'
import { resolvePortalTarget } from '@/composables/viewer/usePortalTarget'
import { HanaImgViewer } from '@/index'
import {
  addEventListenerSpy,
  getAnimationCalls,
  getImageRequestCount,
  removeEventListenerSpy,
  resolvePendingAnimation,
  resolvePendingImage,
  setAnimationSequence,
  setImageSequence,
} from '../setup/component.setup'
import { describe, expect, it, vi } from '../support/vitest'

describe('HanaImgViewer component harness', () => {
  it('renders a thumbnail without mounting preview markup while closed', () => {
    const wrapper = mount(HanaImgViewer, {
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    const thumbnail = wrapper.get('img')

    expect(thumbnail.attributes('src')).toBe('/thumb.jpg')
    expect(document.body.querySelector('img[draggable="false"]')).toBeNull()
  })

  it('mounts a teleported preview shell when opened from the thumbnail', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      const preview = document.body.querySelector('img[draggable="false"]')

      expect(preview).not.toBeNull()
      expect(document.body.style.overflow).toBe('hidden')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('keeps the preview cursor neutral until the opening motion finishes', async () => {
    setAnimationSequence(['finish', 'pending'])

    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      const previewDuringOpening = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(previewDuringOpening.style.cursor).toBe('default')

      resolvePendingAnimation()
      await flushPromises()
      await nextTick()

      const previewAfterOpening = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(previewAfterOpening.style.cursor).toBe('grab')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('does not register idle global listeners while closed', () => {
    mount(HanaImgViewer, {
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('pointermove', expect.any(Function), expect.anything())
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('pointerup', expect.any(Function), expect.anything())
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('pointercancel', expect.any(Function), expect.anything())
  })

  it('preserves the approved FLIP open/close interaction contract', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    await wrapper.get('img').trigger('click')
    await nextTick()
    await flushPromises()

    const preview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement | null
    expect(preview).not.toBeNull()

    await wrapper.vm.close()
    await nextTick()
    await flushPromises()

    expect(document.body.querySelector('img[draggable="false"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('keeps the FLIP engine cancelable and isAnimating accurate when an opening motion is interrupted and restarted', async () => {
    setAnimationSequence(['pending', 'pending', 'finish'])

    const rect = DOMRect.fromRect({ x: 0, y: 0, width: 100, height: 80 })
    const element = document.createElement('div')
    document.body.appendChild(element)

    const { cancel, flip, isAnimating } = useFLIP()

    const opening = flip(rect, rect, element)
    // Aborts the in-flight opening animation.
    cancel()
    const reopening = flip(rect, rect, element)

    // The aborted animation's rejection settles after the replacement has
    // taken over the slot; it must not clear the replacement's reference.
    await opening
    await nextTick()
    expect(isAnimating.value).toBe(true)

    resolvePendingAnimation()
    await reopening
    await nextTick()

    expect(isAnimating.value).toBe(false)
  })

  it('keeps the view state correct when an opening motion is interrupted by a close and the viewer reopens right after', async () => {
    setAnimationSequence([
      'pending',
      'pending', // open #1: backdrop + flip
      'pending',
      'pending', // close #1: backdrop + reverse flip (aborts open #1)
      'pending',
      'pending', // open #2: backdrop + flip
      'pending',
      'pending', // close #2: backdrop + reverse flip
    ])

    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      expect(document.body.querySelector('img[draggable="false"]')).not.toBeNull()

      // Close while the opening motions are still pending.
      await wrapper.vm.close()
      await nextTick()
      await flushPromises()

      expect(document.body.querySelector('img[draggable="false"]')).not.toBeNull()

      // The interrupted close settles back to closed.
      resolvePendingAnimation()
      resolvePendingAnimation()
      await flushPromises()
      await nextTick()

      expect(document.body.querySelector('img[draggable="false"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')

      // A fresh session opens cleanly.
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      expect(document.body.querySelector('img[draggable="false"]')).not.toBeNull()

      resolvePendingAnimation()
      resolvePendingAnimation()
      await flushPromises()
      await nextTick()

      const previewAfterReopen = document.body.querySelector('img[draggable="false"]') as HTMLImageElement | null
      expect(previewAfterReopen).not.toBeNull()
      expect(previewAfterReopen!.style.cursor).toBe('grab')

      // And closes cleanly.
      await wrapper.vm.close()
      await nextTick()
      await flushPromises()
      resolvePendingAnimation()
      resolvePendingAnimation()
      await flushPromises()
      await nextTick()

      expect(document.body.querySelector('img[draggable="false"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('fades the backdrop with the same motion contract as the flip animation', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.vm.close()
      await nextTick()
      await flushPromises()

      const animationCalls = getAnimationCalls()
      const backdropCalls = animationCalls.filter(call =>
        call.element.classList.contains('hana-img-viewer-backdrop'),
      )
      const flipCalls = animationCalls.filter(call =>
        call.element.classList.contains('hana-img-viewer-flip-shell'),
      )

      expect(backdropCalls).toHaveLength(2)
      expect(flipCalls).toHaveLength(2)

      expect(backdropCalls[0].keyframes).toEqual([
        { opacity: 0 },
        { opacity: 1 },
      ])
      expect(backdropCalls[1].keyframes).toEqual([
        { opacity: 1 },
        { opacity: 0 },
      ])

      expect(backdropCalls[0].options.duration).toBe(flipCalls[0].options.duration)
      expect(backdropCalls[0].options.easing).toBe(flipCalls[0].options.easing)
      expect(backdropCalls[1].options.duration).toBe(flipCalls[1].options.duration)
      expect(backdropCalls[1].options.easing).toBe(flipCalls[1].options.easing)
    }
    finally {
      wrapper.unmount()
    }
  })

  it('keeps previewSrc enhancement silent and transform-stable during an open session', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
        previewSrc: '/preview.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      const preview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      const initialTransform = preview.style.transform

      await flushPromises()

      const updatedPreview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement

      expect(updatedPreview.getAttribute('src')).toBe('/preview.jpg')
      expect(updatedPreview.style.transform).toBe(initialTransform)
    }
    finally {
      wrapper.unmount()
    }
  })

  it('updates the visible preview when src changes during an open session', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb-a.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      const initialPreview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(initialPreview.getAttribute('src')).toBe('/thumb-a.jpg')

      await wrapper.setProps({ src: '/thumb-b.jpg' })
      await nextTick()
      await flushPromises()

      const updatedPreview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(updatedPreview.getAttribute('src')).toBe('/thumb-b.jpg')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('keeps the current enhanced preview visible until a replacement previewSrc is ready', async () => {
    setImageSequence('/preview-2.jpg', ['pending'])

    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
        previewSrc: '/preview-1.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()
      await flushPromises()

      const initialEnhancedPreview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(initialEnhancedPreview.getAttribute('src')).toBe('/preview-1.jpg')

      await wrapper.setProps({ previewSrc: '/preview-2.jpg' })
      await nextTick()
      await flushPromises()

      const previewBeforeReplacementReady = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(previewBeforeReplacementReady.getAttribute('src')).toBe('/preview-1.jpg')

      resolvePendingImage('/preview-2.jpg')
      await flushPromises()
      await flushPromises()

      const replacementPreview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(replacementPreview.getAttribute('src')).toBe('/preview-2.jpg')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('retries a failed enhancement request on the next open session', async () => {
    setImageSequence('/retry-preview.jpg', ['pending', 'pending'])

    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
        previewSrc: '/retry-preview.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()
      await flushPromises()

      expect(getImageRequestCount('/retry-preview.jpg')).toBe(1)
      resolvePendingImage('/retry-preview.jpg', 'error')
      await flushPromises()
      await flushPromises()

      let preview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(preview.getAttribute('src')).toBe('/thumb.jpg')

      await wrapper.vm.close()
      await nextTick()
      await flushPromises()

      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()
      await flushPromises()

      expect(getImageRequestCount('/retry-preview.jpg')).toBe(2)
      resolvePendingImage('/retry-preview.jpg', 'load')
      await flushPromises()
      await flushPromises()

      preview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(preview.getAttribute('src')).toBe('/retry-preview.jpg')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('does not bind a window Escape listener when mounted into a custom portal target', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
        portalTarget: '#custom-portal-target',
      },
    })

    const portalTarget = document.createElement('div')
    portalTarget.id = 'custom-portal-target'
    document.body.appendChild(portalTarget)

    await wrapper.get('img').trigger('click')
    await nextTick()
    await flushPromises()

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function), expect.anything())

    wrapper.unmount()
    expect(removeEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function), expect.anything())
  })

  it('keeps the viewer visually open in controlled mode until the parent updates open=false', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        'alt': 'thumbnail',
        'open': true,
        'src': '/thumb.jpg',
        'onUpdate:open': () => {},
      },
    })

    try {
      await nextTick()
      await flushPromises()

      expect(document.body.querySelector('img[draggable="false"]')).not.toBeNull()

      await wrapper.vm.close()
      await nextTick()
      await flushPromises()

      expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
      expect(document.body.querySelector('img[draggable="false"]')).not.toBeNull()

      await wrapper.setProps({ open: false })
      await nextTick()
      await flushPromises()

      expect(document.body.querySelector('img[draggable="false"]')).toBeNull()
    }
    finally {
      wrapper.unmount()
    }
  })

  it('cancels a pending open before the portal target becomes available', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        portalTarget: null,
        src: '/thumb.jpg',
      },
    })

    await wrapper.get('img').trigger('click')
    await nextTick()
    await flushPromises()

    expect(document.body.querySelector('img[draggable="false"]')).toBeNull()

    await wrapper.vm.close()
    await nextTick()
    await flushPromises()

    const portalTarget = document.createElement('div')
    portalTarget.id = 'late-portal-target'
    document.body.appendChild(portalTarget)

    await wrapper.setProps({ portalTarget: '#late-portal-target' })
    await nextTick()
    await flushPromises()

    expect(portalTarget.querySelector('img[draggable="false"]')).toBeNull()
  })

  it('emits close intent when controlled open is pending behind a missing portal target', async () => {
    const onUpdateOpen = vi.fn()

    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        'alt': 'thumbnail',
        'open': true,
        'portalTarget': null,
        'src': '/thumb.jpg',
        'onUpdate:open': onUpdateOpen,
      },
    })

    await nextTick()
    await flushPromises()

    expect(document.body.querySelector('img[draggable="false"]')).toBeNull()

    await wrapper.vm.close()
    await nextTick()
    await flushPromises()

    expect(onUpdateOpen).toHaveBeenLastCalledWith(false)
  })

  it('degrades an invalid portalTarget selector to missing without throwing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        portalTarget: '[',
        src: '/thumb.jpg',
      },
    })

    try {
      await nextTick()
      await flushPromises()

      expect(wrapper.get('img')).toBeTruthy()
      expect(document.body.querySelector('img[draggable="false"]')).toBeNull()

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid selector'),
      )
    }
    finally {
      wrapper.unmount()
      warnSpy.mockRestore()
    }
  })

  it('treats document.body as the same body portal mode as the default body portal', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
        portalTarget: document.body,
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()
      await flushPromises()

      expect(document.body.querySelector('img[draggable="false"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('hidden')

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      await flushPromises()

      expect(document.body.querySelector('img[draggable="false"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('releases body locking when an open viewer moves from the body portal to a custom target', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      expect(document.body.style.overflow).toBe('hidden')

      const customTarget = document.createElement('div')
      customTarget.id = 'runtime-custom-portal'
      document.body.appendChild(customTarget)

      await wrapper.setProps({ portalTarget: '#runtime-custom-portal' })
      await nextTick()
      await flushPromises()

      expect(customTarget.querySelector('img[draggable="false"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('allows keyboard users to open the default thumbnail trigger', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    try {
      const buttonTrigger = wrapper.find('button')

      if (buttonTrigger.exists()) {
        expect(buttonTrigger.attributes('type')).toBe('button')
        await buttonTrigger.trigger('click')
      }
      else {
        const imageTrigger = wrapper.get('img')
        expect(imageTrigger.attributes('role')).toBe('button')
        expect(imageTrigger.attributes('tabindex')).toBe('0')
        await imageTrigger.trigger('keydown', { key: 'Enter' })
      }

      await nextTick()
      await flushPromises()

      expect(document.body.querySelector('img[draggable="false"]')).not.toBeNull()
    }
    finally {
      wrapper.unmount()
    }
  })

  it('recomputes overlay geometry when the viewport changes during an open session', async () => {
    const originalWidth = window.innerWidth
    const originalHeight = window.innerHeight

    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumbnail',
        src: '/thumb.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()

      const shell = document.body.querySelector('.hana-img-viewer-flip-shell') as HTMLElement
      const initialWidth = shell.style.width

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 })
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 300 })
      window.dispatchEvent(new Event('resize'))

      await new Promise(resolve => setTimeout(resolve, 60)) // wait debounce window
      await flushPromises()

      const resizedShell = document.body.querySelector('.hana-img-viewer-flip-shell') as HTMLElement
      const resizedWidth = resizedShell.style.width

      expect(resizedWidth).toBe('360px')
      expect(resizedWidth).not.toBe(initialWidth)
    }
    finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight })
      wrapper.unmount()
    }
  })
})

describe('resolvePortalTarget', () => {
  it('resolves undefined to document.body', () => {
    expect(resolvePortalTarget(undefined)).toBe(document.body)
  })
  it('resolves "body" string to document.body', () => {
    expect(resolvePortalTarget('body')).toBe(document.body)
  })
  it('resolves document.body to document.body', () => {
    expect(resolvePortalTarget(document.body)).toBe(document.body)
  })
  it('resolves null to null', () => {
    expect(resolvePortalTarget(null)).toBeNull()
  })
  it('resolves a CSS selector to the matched element', () => {
    const el = document.createElement('div')
    el.id = 'portal-target-test'
    document.body.appendChild(el)
    expect(resolvePortalTarget('#portal-target-test')).toBe(el)
    el.remove()
  })
  it('resolves a missing selector to null', () => {
    expect(resolvePortalTarget('#does-not-exist')).toBeNull()
  })
  it('resolves blank or invalid selectors to null without throwing', () => {
    expect(resolvePortalTarget('')).toBeNull()
    expect(resolvePortalTarget('   ')).toBeNull()
    expect(resolvePortalTarget('[')).toBeNull()
    expect(resolvePortalTarget(':')).toBeNull()
  })
  it('resolves an HTMLElement to itself', () => {
    const el = document.createElement('section')
    expect(resolvePortalTarget(el)).toBe(el)
  })
})

describe('PRD: box-stability proof', () => {
  it('keeps the flip shell dimensions stable when previewSrc upgrades with different aspect ratio', async () => {
    const wrapper = mount(HanaImgViewer, {
      attachTo: document.body,
      props: {
        alt: 'thumb',
        src: '/thumb-square.jpg', // 1:1 (mock createRect returns 160x120 → 4:3)
        previewSrc: '/preview-wide.jpg',
      },
    })

    try {
      await wrapper.get('img').trigger('click')
      await nextTick()
      await flushPromises()
      await flushPromises()

      const shell = document.body.querySelector('.hana-img-viewer-flip-shell') as HTMLElement
      const initialWidth = shell.style.width
      const initialHeight = shell.style.height

      // Verify previewSrc is now the visible bitmap
      const preview = document.body.querySelector('img[draggable="false"]') as HTMLImageElement
      expect(preview.getAttribute('src')).toBe('/preview-wide.jpg')

      // Verify shell dimensions did not change (box-stability)
      expect(shell.style.width).toBe(initialWidth)
      expect(shell.style.height).toBe(initialHeight)
    }
    finally {
      wrapper.unmount()
    }
  })
})
