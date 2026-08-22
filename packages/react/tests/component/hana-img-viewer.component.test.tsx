import type { HanaImgViewerHandle } from '@/types'

import { act, fireEvent, render, waitFor } from '@testing-library/react'

import { resolvePortalTarget } from '@/hooks/viewer/usePortalTarget'
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

function previewImage(): HTMLImageElement | null {
  return document.body.querySelector<HTMLImageElement>(
    'img[draggable="false"]',
  )
}

function flipShell(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(
    '.hana-img-viewer-flip-shell',
  )
}

describe('HanaImgViewer component harness', () => {
  it('renders a thumbnail without mounting preview markup while closed', () => {
    const { container } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" />,
    )

    const thumbnail = container.querySelector('img')

    expect(thumbnail?.getAttribute('src')).toBe('/thumb.jpg')
    expect(previewImage()).toBeNull()
  })

  it('mounts a teleported preview shell when opened from the thumbnail', async () => {
    const { container } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(previewImage()).not.toBeNull())

    expect(document.body.style.overflow).toBe('hidden')
  })

  it('keeps the preview cursor neutral until the opening motion finishes', async () => {
    setAnimationSequence(['finish', 'pending'])

    const { container } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(previewImage()).not.toBeNull())

    const previewDuringOpening = previewImage()!
    expect(previewDuringOpening.style.cursor).toBe('default')

    resolvePendingAnimation()
    await waitFor(() => expect(previewImage()!.style.cursor).toBe('grab'))
  })

  it('does not register idle global listeners while closed', () => {
    render(<HanaImgViewer src="/thumb.jpg" alt="thumbnail" />)

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'pointermove',
      expect.any(Function),
      expect.anything(),
    )
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'pointerup',
      expect.any(Function),
      expect.anything(),
    )
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'pointercancel',
      expect.any(Function),
      expect.anything(),
    )
  })

  it('preserves the approved FLIP open/close interaction contract', async () => {
    const handleRef = { current: null as HanaImgViewerHandle | null }
    const { container } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" ref={handleRef} />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(previewImage()).not.toBeNull())

    act(() => {
      void handleRef.current?.close()
    })
    await waitFor(() => expect(previewImage()).toBeNull())

    expect(document.body.style.overflow).toBe('')
  })

  it('fades the backdrop with the same motion contract as the flip animation', async () => {
    const handleRef = { current: null as HanaImgViewerHandle | null }
    const { container } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" ref={handleRef} />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(previewImage()).not.toBeNull())

    act(() => {
      void handleRef.current?.close()
    })
    await waitFor(() => expect(previewImage()).toBeNull())

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

    expect(backdropCalls[0].options.duration).toBe(
      flipCalls[0].options.duration,
    )
    expect(backdropCalls[0].options.easing).toBe(flipCalls[0].options.easing)
    expect(backdropCalls[1].options.duration).toBe(
      flipCalls[1].options.duration,
    )
    expect(backdropCalls[1].options.easing).toBe(flipCalls[1].options.easing)
  })

  it('keeps previewSrc enhancement silent and transform-stable during an open session', async () => {
    const { container } = render(
      <HanaImgViewer
        src="/thumb.jpg"
        previewSrc="/preview.jpg"
        alt="thumbnail"
      />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(previewImage()).not.toBeNull())

    const initialTransform = previewImage()!.style.transform

    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/preview.jpg'),
    )

    expect(previewImage()!.style.transform).toBe(initialTransform)
  })

  it('emits open when the session becomes interactive', async () => {
    const onOpen = vi.fn()
    const { container } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" onOpen={onOpen} />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1))
    expect(previewImage()).not.toBeNull()
  })

  it('updates the visible preview when src changes during an open session', async () => {
    const { container, rerender } = render(
      <HanaImgViewer src="/thumb-a.jpg" alt="thumbnail" />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/thumb-a.jpg'),
    )

    rerender(<HanaImgViewer src="/thumb-b.jpg" alt="thumbnail" />)
    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/thumb-b.jpg'),
    )
  })

  it('keeps the current enhanced preview visible until a replacement previewSrc is ready', async () => {
    setImageSequence('/preview-2.jpg', ['pending'])

    const { container, rerender } = render(
      <HanaImgViewer
        src="/thumb.jpg"
        previewSrc="/preview-1.jpg"
        alt="thumbnail"
      />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/preview-1.jpg'),
    )

    rerender(
      <HanaImgViewer
        src="/thumb.jpg"
        previewSrc="/preview-2.jpg"
        alt="thumbnail"
      />,
    )
    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/preview-1.jpg'),
    )

    resolvePendingImage('/preview-2.jpg')
    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/preview-2.jpg'),
    )
  })

  it('retries a failed enhancement request on the next open session', async () => {
    setImageSequence('/retry-preview.jpg', ['pending', 'pending'])

    const handleRef = { current: null as HanaImgViewerHandle | null }
    const { container } = render(
      <HanaImgViewer
        src="/thumb.jpg"
        previewSrc="/retry-preview.jpg"
        alt="thumbnail"
        ref={handleRef}
      />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() =>
      expect(getImageRequestCount('/retry-preview.jpg')).toBe(1),
    )

    resolvePendingImage('/retry-preview.jpg', 'error')
    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/thumb.jpg'),
    )

    act(() => {
      void handleRef.current?.close()
    })
    await waitFor(() => expect(previewImage()).toBeNull())

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() =>
      expect(getImageRequestCount('/retry-preview.jpg')).toBe(2),
    )

    resolvePendingImage('/retry-preview.jpg', 'load')
    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/retry-preview.jpg'),
    )
  })

  it('emits load and error events for enhancement sources', async () => {
    const onLoad = vi.fn()
    const onError = vi.fn()

    const { container, rerender } = render(
      <HanaImgViewer
        src="/thumb.jpg"
        previewSrc="/good-preview.jpg"
        alt="thumbnail"
        onLoad={onLoad}
        onError={onError}
      />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(previewImage()).not.toBeNull())
    await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1))
    expect(onError).not.toHaveBeenCalled()

    setImageSequence('/bad-preview.jpg', ['error'])
    rerender(
      <HanaImgViewer
        src="/thumb.jpg"
        previewSrc="/bad-preview.jpg"
        alt="thumbnail"
        onLoad={onLoad}
        onError={onError}
      />,
    )
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Event)
  })

  it('does not bind a window Escape listener when mounted into a custom portal target', async () => {
    const portalTarget = document.createElement('div')
    portalTarget.id = 'custom-portal-target'
    document.body.appendChild(portalTarget)

    const { container, unmount } = render(
      <HanaImgViewer
        src="/thumb.jpg"
        portalTarget="#custom-portal-target"
        alt="thumbnail"
      />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() =>
      expect(
        portalTarget.querySelector('img[draggable="false"]'),
      ).not.toBeNull(),
    )

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      expect.anything(),
    )

    unmount()
    expect(removeEventListenerSpy).not.toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      expect.anything(),
    )
  })

  it('keeps the viewer visually open in controlled mode until the parent updates open=false', async () => {
    const onOpenChange = vi.fn()
    const handleRef = { current: null as HanaImgViewerHandle | null }
    const { rerender } = render(
      <HanaImgViewer
        src="/thumb.jpg"
        open={true}
        onOpenChange={onOpenChange}
        alt="thumbnail"
        ref={handleRef}
      />,
    )

    await waitFor(() => expect(previewImage()).not.toBeNull())

    act(() => {
      void handleRef.current?.close()
    })
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false))
    expect(previewImage()).not.toBeNull()

    rerender(
      <HanaImgViewer
        src="/thumb.jpg"
        open={false}
        onOpenChange={onOpenChange}
        alt="thumbnail"
        ref={handleRef}
      />,
    )
    await waitFor(() => expect(previewImage()).toBeNull())
  })

  it('cancels a pending open before the portal target becomes available', async () => {
    const handleRef = { current: null as HanaImgViewerHandle | null }
    const { container, rerender } = render(
      <HanaImgViewer
        src="/thumb.jpg"
        portalTarget={null}
        alt="thumbnail"
        ref={handleRef}
      />,
    )

    fireEvent.click(container.querySelector('img')!)
    await act(async () => {
      /* drain effects and microtasks */
    })
    expect(previewImage()).toBeNull()

    act(() => {
      void handleRef.current?.close()
    })
    await act(async () => {
      /* drain effects and microtasks */
    })

    const portalTarget = document.createElement('div')
    portalTarget.id = 'late-portal-target'
    document.body.appendChild(portalTarget)

    rerender(
      <HanaImgViewer
        src="/thumb.jpg"
        portalTarget="#late-portal-target"
        alt="thumbnail"
      />,
    )
    await act(async () => {
      /* drain effects and microtasks */
    })

    expect(portalTarget.querySelector('img[draggable="false"]')).toBeNull()
  })

  it('emits close intent when controlled open is pending behind a missing portal target', async () => {
    const onOpenChange = vi.fn()
    let handle: HanaImgViewerHandle | null = null

    render(
      <HanaImgViewer
        src="/thumb.jpg"
        open={true}
        portalTarget={null}
        onOpenChange={onOpenChange}
        alt="thumbnail"
        ref={(h) => {
          handle = h
        }}
      />,
    )

    await act(async () => {
      /* drain effects and microtasks */
    })
    expect(previewImage()).toBeNull()

    act(() => {
      void handle?.close()
    })
    await act(async () => {
      /* drain effects and microtasks */
    })

    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('treats document.body as the same body portal mode as the default body portal', async () => {
    const { container } = render(
      <HanaImgViewer
        src="/thumb.jpg"
        portalTarget={document.body}
        alt="thumbnail"
      />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(previewImage()).not.toBeNull())
    await waitFor(() => expect(previewImage()!.style.cursor).toBe('grab'))
    expect(document.body.style.overflow).toBe('hidden')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    await waitFor(() => expect(previewImage()).toBeNull())
    expect(document.body.style.overflow).toBe('')
  })

  it('releases body locking when an open viewer moves from the body portal to a custom target', async () => {
    const { container, rerender } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'))

    const customTarget = document.createElement('div')
    customTarget.id = 'runtime-custom-portal'
    document.body.appendChild(customTarget)

    rerender(
      <HanaImgViewer
        src="/thumb.jpg"
        portalTarget="#runtime-custom-portal"
        alt="thumbnail"
      />,
    )
    await waitFor(() =>
      expect(
        customTarget.querySelector('img[draggable="false"]'),
      ).not.toBeNull(),
    )
    await waitFor(() => expect(document.body.style.overflow).toBe(''))
  })

  it('allows keyboard users to open the default thumbnail trigger', async () => {
    const { container } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" />,
    )

    const imageTrigger = container.querySelector('img')!
    expect(imageTrigger.getAttribute('role')).toBe('button')
    expect(imageTrigger.getAttribute('tabindex')).toBe('0')

    fireEvent.keyDown(imageTrigger, { key: 'Enter' })
    await waitFor(() => expect(previewImage()).not.toBeNull())
  })

  it('recomputes overlay geometry when the viewport changes during an open session', async () => {
    const originalWidth = window.innerWidth
    const originalHeight = window.innerHeight

    const { container } = render(
      <HanaImgViewer src="/thumb.jpg" alt="thumbnail" />,
    )

    try {
      fireEvent.click(container.querySelector('img')!)
      await waitFor(() => expect(flipShell()).not.toBeNull())
      await waitFor(() => expect(previewImage()!.style.cursor).toBe('grab'))

      const initialWidth = flipShell()!.style.width

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 400,
      })
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 300,
      })
      window.dispatchEvent(new Event('resize'))

      await new Promise(resolve => setTimeout(resolve, 60)) // wait debounce window
      await act(async () => {
        /* drain effects and microtasks */
      })

      const resizedWidth = flipShell()!.style.width

      expect(resizedWidth).toBe('360px')
      expect(resizedWidth).not.toBe(initialWidth)
    }
    finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalWidth,
      })
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: originalHeight,
      })
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
  it('resolves an HTMLElement to itself', () => {
    const el = document.createElement('section')
    expect(resolvePortalTarget(el)).toBe(el)
  })
})

describe('PRD: box-stability proof', () => {
  it('keeps the flip shell dimensions stable when previewSrc upgrades with different aspect ratio', async () => {
    const { container } = render(
      <HanaImgViewer
        src="/thumb-square.jpg"
        previewSrc="/preview-wide.jpg"
        alt="thumb"
      />,
    )

    fireEvent.click(container.querySelector('img')!)
    await waitFor(() => expect(flipShell()).not.toBeNull())

    const initialWidth = flipShell()!.style.width
    const initialHeight = flipShell()!.style.height

    // Verify previewSrc is now the visible bitmap
    await waitFor(() =>
      expect(previewImage()!.getAttribute('src')).toBe('/preview-wide.jpg'),
    )

    // Verify shell dimensions did not change (box-stability)
    expect(flipShell()!.style.width).toBe(initialWidth)
    expect(flipShell()!.style.height).toBe(initialHeight)
  })
})
