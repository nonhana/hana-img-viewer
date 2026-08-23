import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { StrictMode, useState } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import HanaImgViewer from '@/index'
import {
  createPointerEvent,
  createTouchEvent,
  getAnimationCalls,
  getImageRequestCount,
  getPendingAnimationCount,
  resolvePendingAnimation,
  resolvePendingImage,
  setAnimationSequence,
  setImageSequence,
  setSelectorClientSize,
  setSelectorRect,
  triggerResizeObservers,
} from '../setup/component.setup'
import { describe, expect, it, vi } from '../support/vitest'

const getTrigger = (container: HTMLElement): HTMLImageElement =>
  container.querySelector<HTMLImageElement>('.hana-img-viewer-thumbnail')!

const getPreview = (): HTMLImageElement =>
  document.querySelector<HTMLImageElement>('.hana-img-viewer-preview')!

const getDialog = (): HTMLDivElement | null =>
  document.querySelector<HTMLDivElement>('.hana-img-viewer-overlay')

const finishFrames = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

describe('HanaImgViewer replacement', () => {
  it('[behavior/B1] opens from click, Enter, and Space and closes after Escape', async () => {
    const { container } = render(<HanaImgViewer src="thumb.jpg" />)
    const trigger = getTrigger(container)

    fireEvent.keyDown(trigger, { key: 'Enter' })
    await waitFor(() => expect(getDialog()).not.toBeNull())
    fireEvent.keyDown(getDialog()!, { key: 'Escape' })
    await waitFor(() => expect(getDialog()).toBeNull())

    fireEvent.keyDown(trigger, { key: ' ' })
    await waitFor(() => expect(getDialog()).not.toBeNull())
    fireEvent.keyDown(getDialog()!, { key: 'Escape' })
    await waitFor(() => expect(getDialog()).toBeNull())

    fireEvent.click(trigger)
    await waitFor(() => expect(getDialog()).not.toBeNull())
  })

  it('[react-interface/R1] supports defaultOpen, custom children, and callback-only uncontrolled usage', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = render(
      <HanaImgViewer
        src="thumb.jpg"
        defaultOpen
        onOpenChange={onOpenChange}
      >
        {({ open }) => <button onClick={open}>Custom trigger</button>}
      </HanaImgViewer>,
    )

    await waitFor(() => expect(getDialog()).not.toBeNull())
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)
    await waitFor(() => expect(getDialog()).toBeNull())
    expect(onOpenChange).toHaveBeenLastCalledWith(false)

    fireEvent.click(getByRole('button', { name: 'Custom trigger' }))
    await waitFor(() => expect(getDialog()).not.toBeNull())
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
  })

  it('[behavior/B2] waits for controlled parent acknowledgement without echoing prop sync', async () => {
    const onOpenChange = vi.fn()
    const view = render(
      <HanaImgViewer src="thumb.jpg" open onOpenChange={onOpenChange} />,
    )

    await waitFor(() => expect(getDialog()).not.toBeNull())
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)
    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(getDialog()).not.toBeNull()

    view.rerender(
      <HanaImgViewer src="thumb.jpg" open={false} onOpenChange={onOpenChange} />,
    )
    await waitFor(() => expect(getDialog()).toBeNull())
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  it('[behavior/B2] reverses active opening and closing animations', async () => {
    setAnimationSequence([
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
    ])
    const view = render(<HanaImgViewer src="thumb.jpg" open />)

    await waitFor(() => expect(getPendingAnimationCount()).toBe(2))
    view.rerender(<HanaImgViewer src="thumb.jpg" open={false} />)
    await waitFor(() => expect(getPendingAnimationCount()).toBe(2))
    view.rerender(<HanaImgViewer src="thumb.jpg" open />)
    await waitFor(() => expect(getPendingAnimationCount()).toBe(2))

    act(() => {
      resolvePendingAnimation()
      resolvePendingAnimation()
    })
    await waitFor(() => expect(getDialog()).not.toBeNull())
    expect(getAnimationCalls()).toHaveLength(6)
  })

  it('[behavior/B2/B7] preserves the zoom target when a reversed opening remeasures', async () => {
    const view = render(<HanaImgViewer src="thumb.jpg" open />)
    await waitFor(() => expect(getDialog()).not.toBeNull())
    await finishFrames()
    fireEvent.doubleClick(getPreview(), { clientX: 300, clientY: 300 })
    await waitFor(() => expect(getPreview().style.transform).toContain('scale(2)'))

    setAnimationSequence([
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
    ])
    view.rerender(<HanaImgViewer src="thumb.jpg" open={false} />)
    await waitFor(() => expect(getPendingAnimationCount()).toBe(2))
    view.rerender(<HanaImgViewer src="thumb.jpg" open />)
    await waitFor(() => expect(getPendingAnimationCount()).toBe(2))

    const shell = document.querySelector<HTMLElement>(
      '.hana-img-viewer-flip-shell',
    )!
    shell.style.transform = 'matrix(1, 0, 0, 1, 10, 20)'
    setSelectorClientSize('.hana-img-viewer-overlay', {
      width: 800,
      height: 600,
    })
    act(() => triggerResizeObservers())

    await waitFor(() => {
      const shellCalls = getAnimationCalls().filter(call =>
        call.element.classList.contains('hana-img-viewer-flip-shell'),
      )
      expect(shellCalls).toHaveLength(4)
      expect(shellCalls[2].keyframes[1]?.transform).toContain('scale(2)')
      expect(shellCalls[3].keyframes[1]?.transform).toContain('scale(2)')
    })
  })

  it('[react-interface/R2] keeps explicit null pending and resumes with a custom container', async () => {
    const host = document.createElement('section')
    document.body.append(host)
    const view = render(
      <HanaImgViewer src="thumb.jpg" defaultOpen container={null} />,
    )

    expect(getDialog()).toBeNull()
    expect(getTrigger(view.container).parentElement?.style.visibility).not.toBe(
      'hidden',
    )
    expect(document.body.style.overflow).toBe('')

    view.rerender(
      <HanaImgViewer src="thumb.jpg" defaultOpen container={host} />,
    )
    await waitFor(() => expect(host.querySelector('[role="dialog"]')).not.toBeNull())
    expect(document.body.style.overflow).toBe('')
  })

  it('[react-interface/R2] cancels body ownership while moving through body, custom, and null containers', async () => {
    const host = document.createElement('section')
    document.body.append(host)
    const view = render(<HanaImgViewer src="thumb.jpg" defaultOpen />)

    await waitFor(() => expect(getDialog()).not.toBeNull())
    expect(document.body.style.overflow).toBe('hidden')

    view.rerender(
      <HanaImgViewer src="thumb.jpg" defaultOpen container={host} />,
    )
    expect(host.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.body.style.overflow).toBe('')

    view.rerender(
      <HanaImgViewer src="thumb.jpg" defaultOpen container={null} />,
    )
    expect(getDialog()).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(getTrigger(view.container).parentElement?.style.visibility).not.toBe(
      'hidden',
    )
  })

  it('[behavior/B12] reference-counts body locks and preserves host writes', async () => {
    const ControlledPair = () => {
      const [firstOpen, setFirstOpen] = useState(true)
      const [secondOpen, setSecondOpen] = useState(true)
      return (
        <>
          <HanaImgViewer
            src="first.jpg"
            open={firstOpen}
            onOpenChange={setFirstOpen}
          />
          <HanaImgViewer
            src="second.jpg"
            open={secondOpen}
            onOpenChange={setSecondOpen}
          />
        </>
      )
    }
    render(<ControlledPair />)

    await waitFor(() =>
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2),
    )
    expect(document.body.style.overflow).toBe('hidden')

    const backdrops = document.querySelectorAll('.hana-img-viewer-backdrop')
    fireEvent.click(backdrops[0])
    await waitFor(() =>
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1),
    )
    expect(document.body.style.overflow).toBe('hidden')

    document.body.style.overflow = 'clip'
    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)
    await waitFor(() => expect(getDialog()).toBeNull())
    expect(document.body.style.overflow).toBe('clip')
  })

  it('[behavior/B7] animates between distinct origin and destination geometry', async () => {
    setSelectorRect('.origin', { x: 10, y: 20, width: 100, height: 80 })
    setSelectorRect('.hana-img-viewer-flip-shell', {
      x: 100,
      y: 120,
      width: 800,
      height: 600,
    })
    render(<HanaImgViewer src="thumb.jpg" defaultOpen className="origin" />)

    await waitFor(() => expect(getAnimationCalls().length).toBeGreaterThan(1))
    const shellAnimation = getAnimationCalls().find(call =>
      call.element.classList.contains('hana-img-viewer-flip-shell'),
    )!

    expect(shellAnimation.keyframes[0]?.transform).toContain('translate(')
    expect(shellAnimation.keyframes[0]?.transform).toContain('scale(0.125')
    expect(shellAnimation.keyframes[1]?.transform).toContain('scale(1)')
  })

  it('[behavior/B7] resumes an opening animation from its current visual state after resize', async () => {
    let now = 100
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    setAnimationSequence(['pending', 'pending', 'pending', 'pending'])
    render(<HanaImgViewer src="thumb.jpg" defaultOpen />)
    await waitFor(() => expect(getPendingAnimationCount()).toBe(2))

    const shell = document.querySelector<HTMLElement>(
      '.hana-img-viewer-flip-shell',
    )!
    shell.style.transform = 'matrix(1, 0, 0, 1, 10, 20)'
    now = 350
    setSelectorClientSize('.hana-img-viewer-overlay', {
      width: 800,
      height: 600,
    })
    act(() => triggerResizeObservers())

    await waitFor(() => {
      const shellCalls = getAnimationCalls().filter(call =>
        call.element.classList.contains('hana-img-viewer-flip-shell'),
      )
      expect(shellCalls).toHaveLength(2)
      expect(shellCalls[1].keyframes[0]?.transform).toBe(
        'matrix(1, 0, 0, 1, 10, 20)',
      )
      expect(shellCalls[1].options.duration).toBe(50)
    })
  })

  it('[behavior/B7/B8] remeasures geometry after a replacement thumbnail loads', async () => {
    const { container } = render(
      <HanaImgViewer src="wide.jpg" defaultOpen />,
    )
    await waitFor(() => expect(getDialog()).not.toBeNull())
    const thumbnail = getTrigger(container)
    const shell = document.querySelector<HTMLElement>(
      '.hana-img-viewer-flip-shell',
    )!

    Object.defineProperties(thumbnail, {
      naturalHeight: { configurable: true, value: 500 },
      naturalWidth: { configurable: true, value: 1000 },
    })
    fireEvent.load(thumbnail)

    await waitFor(() => expect(shell.style.height).toBe('460.8px'))
  })

  it('[behavior/B9] upgrades silently and retries a failed enhancement next session', async () => {
    setImageSequence('preview.jpg', ['error', 'load'])
    const { container } = render(
      <HanaImgViewer src="thumb.jpg" previewSrc="preview.jpg" />,
    )

    fireEvent.click(getTrigger(container))
    await waitFor(() => expect(getImageRequestCount('preview.jpg')).toBe(1))
    expect(getPreview().src).toContain('thumb.jpg')
    await finishFrames()

    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)
    await waitFor(() => expect(getDialog()).toBeNull())
    fireEvent.click(getTrigger(container))

    await waitFor(() => expect(getImageRequestCount('preview.jpg')).toBe(2))
    await waitFor(() => expect(getPreview().src).toContain('preview.jpg'))
  })

  it('[behavior/B8] ignores stale in-flight preview replacements and applies the latest', async () => {
    setImageSequence('first-preview.jpg', ['pending'])
    setImageSequence('second-preview.jpg', ['pending'])
    const view = render(
      <HanaImgViewer
        src="thumb.jpg"
        previewSrc="first-preview.jpg"
        defaultOpen
      />,
    )

    await waitFor(() => expect(getImageRequestCount('first-preview.jpg')).toBe(1))
    view.rerender(
      <HanaImgViewer
        src="thumb.jpg"
        previewSrc="second-preview.jpg"
        defaultOpen
      />,
    )
    await waitFor(() => expect(getImageRequestCount('second-preview.jpg')).toBe(1))

    act(() => resolvePendingImage('first-preview.jpg'))
    await finishFrames()
    expect(getPreview().src).toContain('thumb.jpg')

    act(() => resolvePendingImage('second-preview.jpg'))
    await waitFor(() => expect(getPreview().src).toContain('second-preview.jpg'))
  })

  it('[behavior/B8] returns immediately to a replacement src', async () => {
    const view = render(
      <HanaImgViewer src="first.jpg" previewSrc="enhanced.jpg" defaultOpen />,
    )
    await waitFor(() => expect(getPreview().src).toContain('enhanced.jpg'))

    view.rerender(
      <HanaImgViewer src="second.jpg" previewSrc="next.jpg" defaultOpen />,
    )
    expect(getPreview().src).toContain('second.jpg')
    await waitFor(() => expect(getPreview().src).toContain('next.jpg'))
  })

  it('[behavior/B8/B9] clears a previous enhancement for removal, failure, and source round-trips', async () => {
    setImageSequence('first-preview.jpg', ['load', 'pending'])
    const view = render(
      <HanaImgViewer
        src="first.jpg"
        previewSrc="first-preview.jpg"
        defaultOpen
      />,
    )
    await waitFor(() => expect(getPreview().src).toContain('first-preview.jpg'))

    view.rerender(<HanaImgViewer src="first.jpg" defaultOpen />)
    expect(getPreview().src).toContain('first.jpg')

    setImageSequence('failed-preview.jpg', ['error'])
    view.rerender(
      <HanaImgViewer
        src="first.jpg"
        previewSrc="failed-preview.jpg"
        defaultOpen
      />,
    )
    await finishFrames()
    expect(getPreview().src).toContain('first.jpg')

    setImageSequence('second-preview.jpg', ['pending'])
    view.rerender(
      <HanaImgViewer
        src="second.jpg"
        previewSrc="second-preview.jpg"
        defaultOpen
      />,
    )
    expect(getPreview().src).toContain('second.jpg')

    view.rerender(
      <HanaImgViewer
        src="first.jpg"
        previewSrc="first-preview.jpg"
        defaultOpen
      />,
    )
    expect(getPreview().src).toContain('first.jpg')
  })

  it('[behavior/B9] reuses one in-flight enhancement during StrictMode effect replay', async () => {
    setImageSequence('preview.jpg', ['pending'])
    render(
      <StrictMode>
        <HanaImgViewer
          src="thumb.jpg"
          previewSrc="preview.jpg"
          defaultOpen
        />
      </StrictMode>,
    )

    await waitFor(() => expect(getImageRequestCount('preview.jpg')).toBe(1))
    act(() => resolvePendingImage('preview.jpg'))
    await waitFor(() => expect(getPreview().src).toContain('preview.jpg'))
  })

  it('[behavior/B3/B5/B6] handles wheel, double-click, and drag through the public component', async () => {
    const view = render(<HanaImgViewer src="thumb.jpg" />)
    const { container } = view
    fireEvent.click(getTrigger(container))
    await waitFor(() => expect(getDialog()).not.toBeNull())
    await finishFrames()

    const preview = getPreview()
    const initialTransform = preview.style.transform
    expect(preview.style.cursor).toBe('grab')
    act(() => {
      preview.dispatchEvent(createPointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      }))
      preview.dispatchEvent(createPointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: 130,
        clientY: 120,
        pointerId: 1,
      }))
      preview.dispatchEvent(createPointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: 130,
        clientY: 120,
        pointerId: 1,
      }))
    })
    await waitFor(() => {
      expect(preview.style.transform).not.toBe(initialTransform)
      expect(preview.style.transform).toContain('translate3d(30px, 20px, 0)')
    })
    expect(preview.style.cursor).toBe('grab')

    fireEvent.wheel(preview, {
      deltaMode: 1,
      deltaY: 100,
      clientX: 400,
      clientY: 300,
    })
    await waitFor(() => expect(preview.style.transform).toContain('scale(0.8)'))
    expect(preview.style.cursor).toBe('grab')

    const shrunkenX = Number.parseFloat(
      preview.style.transform.match(/translate3d\(([-\d.]+)px/)?.[1] ?? '0',
    )
    act(() => {
      preview.dispatchEvent(createPointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        pointerId: 2,
      }))
      preview.dispatchEvent(createPointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: 130,
        clientY: 120,
        pointerId: 2,
      }))
      preview.dispatchEvent(createPointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: 130,
        clientY: 120,
        pointerId: 2,
      }))
    })
    await waitFor(() => {
      const draggedX = Number.parseFloat(
        preview.style.transform.match(/translate3d\(([-\d.]+)px/)?.[1] ?? '0',
      )
      expect(draggedX).toBe(shrunkenX + 30)
    })

    const shrunkenDragTransform = preview.style.transform
    view.rerender(<HanaImgViewer src="thumb.jpg" maxZoom={9} />)
    await waitFor(() =>
      expect(preview.style.transform).toBe(shrunkenDragTransform),
    )

    fireEvent.doubleClick(preview, { clientX: 400, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(1)'))
    fireEvent.doubleClick(preview, { clientX: 400, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(2)'))

    const initialX = Number.parseFloat(
      preview.style.transform.match(/translate3d\(([-\d.]+)px/)?.[1] ?? '0',
    )
    act(() => {
      preview.dispatchEvent(createPointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      }))
      preview.dispatchEvent(createPointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: 130,
        clientY: 120,
        pointerId: 1,
      }))
    })
    await waitFor(() => {
      const draggedX = Number.parseFloat(
        preview.style.transform.match(/translate3d\(([-\d.]+)px/)?.[1] ?? '0',
      )
      expect(draggedX).toBe(initialX + 30)
    })

    fireEvent.doubleClick(preview, { clientX: 400, clientY: 300 })
    await waitFor(() =>
      expect(preview.style.transform).toBe(
        'translate3d(0px, 0px, 0) scale(1)',
      ),
    )
  })

  it('[behavior/B4] gives pinch ownership over an active drag', async () => {
    const view = render(<HanaImgViewer src="thumb.jpg" />)
    const { container } = view
    fireEvent.click(getTrigger(container))
    await waitFor(() => expect(getDialog()).not.toBeNull())
    await finishFrames()
    const preview = getPreview()

    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(2)'))
    act(() => {
      preview.dispatchEvent(createPointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      }))
      preview.dispatchEvent(createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]))
      preview.dispatchEvent(createTouchEvent('touchmove', [
        { clientX: 75, clientY: 100 },
        { clientX: 225, clientY: 100 },
      ]))
    })

    await waitFor(() => expect(preview.style.transform).toContain('scale(3)'))
    expect(preview.style.cursor).toBe('grabbing')

    view.rerender(<HanaImgViewer src="thumb.jpg" maxZoom={9} />)
    await waitFor(() => expect(preview.style.cursor).toBe('grab'))
  })

  it('[react-interface/R3] disables zoom gestures when zoom is false', async () => {
    const { container } = render(<HanaImgViewer src="thumb.jpg" zoom={false} />)
    fireEvent.click(getTrigger(container))
    await waitFor(() => expect(getDialog()).not.toBeNull())
    await finishFrames()
    const preview = getPreview()

    fireEvent.wheel(preview, { deltaY: -100, clientX: 100, clientY: 100 })
    fireEvent.doubleClick(preview, { clientX: 100, clientY: 100 })
    act(() => {
      preview.dispatchEvent(createTouchEvent('touchstart', [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ]))
    })
    await finishFrames()

    expect(preview.style.transform).toContain('scale(1)')
  })

  it('[behavior/B3] clamps wheel zoom and preserves transform across resize', async () => {
    const view = render(
      <HanaImgViewer src="thumb.jpg" minZoom={0.5} maxZoom={1.5} />,
    )
    const { container } = view
    fireEvent.click(getTrigger(container))
    await waitFor(() => expect(getDialog()).not.toBeNull())
    await finishFrames()
    const preview = getPreview()

    fireEvent.wheel(preview, {
      deltaMode: 1,
      deltaY: -1000,
      clientX: 300,
      clientY: 300,
    })
    await waitFor(() => expect(preview.style.transform).toContain('scale(1.5)'))
    const transform = preview.style.transform

    act(() => window.dispatchEvent(new Event('resize')))
    await finishFrames()
    expect(preview.style.transform).toBe(transform)

    fireEvent.wheel(preview, {
      deltaMode: 1,
      deltaY: 1000,
      clientX: 300,
      clientY: 300,
    })
    await waitFor(() => expect(preview.style.transform).toContain('scale(0.5)'))

    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(1)'))
    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(1.5)'))

    view.rerender(
      <HanaImgViewer src="thumb.jpg" minZoom={0.5} maxZoom={1.25} />,
    )
    await waitFor(() => expect(preview.style.transform).toContain('scale(1.25)'))
  })

  it('[behavior/B3/B11] anchors zoom to the actual custom-container viewport', async () => {
    const host = document.createElement('section')
    document.body.append(host)
    setSelectorRect('.hana-img-viewer-overlay', {
      x: 100,
      y: 50,
      width: 400,
      height: 300,
    })
    setSelectorClientSize('.hana-img-viewer-overlay', {
      width: 800,
      height: 600,
    })
    setSelectorRect('.hana-img-viewer-flip-shell', {
      x: 120,
      y: 80,
      width: 360,
      height: 270,
    })
    render(
      <HanaImgViewer src="thumb.jpg" container={host} defaultOpen />,
    )
    await waitFor(() => expect(getDialog()).not.toBeNull())
    await finishFrames()
    const preview = getPreview()
    const shell = document.querySelector<HTMLElement>(
      '.hana-img-viewer-flip-shell',
    )!
    expect(shell.style.width).toBe('720px')
    expect(shell.style.height).toBe('540px')

    setSelectorClientSize('.hana-img-viewer-overlay', {
      width: 600,
      height: 400,
    })
    act(() => triggerResizeObservers())
    await waitFor(() => expect(shell.style.width).toBe('480px'))
    expect(shell.style.height).toBe('360px')

    fireEvent.wheel(preview, {
      deltaMode: 1,
      deltaY: -100,
      clientX: 300,
      clientY: 215,
    })

    await waitFor(() =>
      expect(preview.style.transform).toBe(
        'translate3d(0px, 0px, 0) scale(1.2)',
      ),
    )
  })

  it('[behavior/B3/B5] keeps pan independent when dynamic zoom bounds clamp scale', async () => {
    const view = render(<HanaImgViewer src="thumb.jpg" defaultOpen />)
    await waitFor(() => expect(getDialog()).not.toBeNull())
    await finishFrames()
    const preview = getPreview()

    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(2)'))
    const beforePan = preview.style.transform
    act(() => {
      preview.dispatchEvent(createPointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      }))
      preview.dispatchEvent(createPointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: 300,
        clientY: 250,
        pointerId: 1,
      }))
    })
    await waitFor(() => expect(preview.style.transform).not.toBe(beforePan))
    const pannedTranslate = preview.style.transform.split(' scale(')[0]

    view.rerender(<HanaImgViewer src="thumb.jpg" maxZoom={1} defaultOpen />)
    await waitFor(() =>
      expect(preview.style.transform).toBe(
        `${pannedTranslate} scale(1)`,
      ),
    )
  })

  it('[behavior/B6] restores baseline zoom when valid bounds exclude scale one', async () => {
    const view = render(
      <HanaImgViewer src="thumb.jpg" minZoom={1.5} maxZoom={3} defaultOpen />,
    )
    await waitFor(() => expect(getDialog()).not.toBeNull())
    await finishFrames()
    const preview = getPreview()

    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(2)'))
    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(1)'))

    view.rerender(
      <HanaImgViewer src="thumb.jpg" minZoom={0.5} maxZoom={0.75} defaultOpen />,
    )
    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(0.75)'))
    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(1)'))

    view.rerender(
      <HanaImgViewer src="thumb.jpg" minZoom={0.5} maxZoom={0.995} defaultOpen />,
    )
    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(0.995)'))
    fireEvent.doubleClick(preview, { clientX: 300, clientY: 300 })
    await waitFor(() => expect(preview.style.transform).toContain('scale(1)'))
  })

  it('[behavior/B1/B10] honors backdrop and Escape dismissal flags', async () => {
    const view = render(
      <HanaImgViewer
        src="thumb.jpg"
        defaultOpen
        closeOnBackdropClick={false}
        closeOnEscape={false}
      />,
    )
    await waitFor(() => expect(getDialog()).not.toBeNull())

    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)
    fireEvent.keyDown(getDialog()!, { key: 'Escape' })
    expect(getDialog()).not.toBeNull()

    view.rerender(
      <HanaImgViewer
        src="thumb.jpg"
        defaultOpen
        closeOnBackdropClick
        closeOnEscape
      />,
    )
    fireEvent.keyDown(getDialog()!, { key: 'Escape' })
    await waitFor(() => expect(getDialog()).toBeNull())
  })

  it('[behavior/B10/B11] keeps handled dismissal inside the viewer and delegates disabled paths', async () => {
    const host = document.createElement('section')
    const hostKeyDown = vi.fn()
    const hostClick = vi.fn()
    host.addEventListener('keydown', hostKeyDown)
    host.addEventListener('click', hostClick)
    document.body.append(host)
    const view = render(
      <HanaImgViewer src="thumb.jpg" defaultOpen container={host} />,
    )
    await waitFor(() => expect(getDialog()).not.toBeNull())

    fireEvent.keyDown(getDialog()!, { key: 'Escape' })
    await waitFor(() => expect(getDialog()).toBeNull())
    expect(hostKeyDown).not.toHaveBeenCalled()

    fireEvent.click(getTrigger(view.container))
    await waitFor(() => expect(getDialog()).not.toBeNull())
    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)
    await waitFor(() => expect(getDialog()).toBeNull())
    expect(hostClick).not.toHaveBeenCalled()

    view.rerender(
      <HanaImgViewer
        src="thumb.jpg"
        defaultOpen
        container={host}
        closeOnBackdropClick={false}
        closeOnEscape={false}
      />,
    )
    fireEvent.click(getTrigger(view.container))
    await waitFor(() => expect(getDialog()).not.toBeNull())
    fireEvent.keyDown(getDialog()!, { key: 'Escape' })
    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)

    expect(getDialog()).not.toBeNull()
    expect(hostKeyDown).toHaveBeenCalledOnce()
    expect(hostClick).toHaveBeenCalledOnce()
  })

  it('[behavior/B10] focuses and restores the trigger and scopes Escape to the focused overlay', async () => {
    const { container } = render(
      <>
        <HanaImgViewer src="first.jpg" defaultOpen />
        <HanaImgViewer src="second.jpg" defaultOpen />
      </>,
    )
    await waitFor(() =>
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2),
    )
    const dialogs = document.querySelectorAll<HTMLDivElement>('[role="dialog"]')
    dialogs[0].focus()
    fireEvent.keyDown(dialogs[0], { key: 'Escape' })

    await waitFor(() =>
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1),
    )
    expect(document.activeElement).toBe(getTrigger(container))
  })

  it('[react-interface/R4] cleans pending animations and body ownership on unmount', async () => {
    setAnimationSequence(['pending', 'pending'])
    const view = render(<HanaImgViewer src="thumb.jpg" defaultOpen />)
    await waitFor(() => expect(getPendingAnimationCount()).toBe(2))
    expect(document.body.style.overflow).toBe('hidden')

    view.unmount()

    expect(getPendingAnimationCount()).toBe(0)
    expect(getDialog()).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('[react-interface/R4] invalidates pending image work on unmount', async () => {
    setImageSequence('preview.jpg', ['pending'])
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const view = render(
      <HanaImgViewer src="thumb.jpg" previewSrc="preview.jpg" defaultOpen />,
    )
    await waitFor(() => expect(getImageRequestCount('preview.jpg')).toBe(1))

    view.unmount()
    act(() => resolvePendingImage('preview.jpg'))
    await finishFrames()

    expect(getDialog()).toBeNull()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('[behavior/B13] hydrates in StrictMode without mismatch or leaked effects', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const host = document.createElement('div')
    host.innerHTML = renderToString(
      <StrictMode>
        <HanaImgViewer src="thumb.jpg" open />
      </StrictMode>,
    )
    document.body.append(host)

    const root = hydrateRoot(
      host,
      <StrictMode>
        <HanaImgViewer src="thumb.jpg" open />
      </StrictMode>,
    )
    await waitFor(() => expect(getDialog()).not.toBeNull())

    expect(consoleError).not.toHaveBeenCalled()
    act(() => root.unmount())
    expect(document.body.style.overflow).toBe('')
  })
})
