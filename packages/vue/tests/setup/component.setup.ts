import { afterEach, vi } from '../support/vitest'

const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

type MockImageOutcome = 'load' | 'error' | 'pending'
type MockAnimationOutcome = 'finish' | 'pending'

interface PendingAnimationRequest {
  cancel: () => void
  finish: () => void
}

interface MockAnimationCall {
  element: HTMLElement
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
}

const imageOutcomeSequences = new Map<string, MockImageOutcome[]>()
const pendingImageRequests = new Map<string, Array<{
  error: () => void
  load: () => void
}>>()
const imageRequestCounts = new Map<string, number>()
const animationOutcomeQueue: MockAnimationOutcome[] = []
const pendingAnimations: PendingAnimationRequest[] = []
const animationCalls: MockAnimationCall[] = []
const elementRects = new Map<HTMLElement, DOMRect>()
const selectorRects = new Map<string, DOMRect>()
const selectorClientSizes = new Map<string, { width: number, height: number }>()
const resizeObservers = new Set<MockResizeObserver>()
const pointerCaptures = new Map<HTMLElement, Set<number>>()

class MockResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObservers.add(this)
  }

  disconnect() {
    resizeObservers.delete(this)
  }

  observe() {}

  trigger() {
    this.callback([], this as unknown as ResizeObserver)
  }

  unobserve() {}
}

function createRect(): DOMRect {
  return (
    DOMRect.fromRect({
      x: 24,
      y: 24,
      width: 160,
      height: 120,
    })
  )
}

function consumeImageOutcome(url: string): MockImageOutcome {
  const sequence = imageOutcomeSequences.get(url)

  if (!sequence?.length)
    return 'load'

  const nextOutcome = sequence.shift() ?? 'load'

  if (sequence.length === 0)
    imageOutcomeSequences.delete(url)

  return nextOutcome
}

function queueImageResult(callback: () => void) {
  queueMicrotask(callback)
}

function pushPendingImageRequest(
  url: string,
  request: {
    error: () => void
    load: () => void
  },
) {
  const requests = pendingImageRequests.get(url) ?? []
  requests.push(request)
  pendingImageRequests.set(url, requests)
}

function incrementImageRequestCount(url: string) {
  imageRequestCounts.set(url, (imageRequestCounts.get(url) ?? 0) + 1)
}

function resetImageMockState() {
  imageOutcomeSequences.clear()
  pendingImageRequests.clear()
  imageRequestCounts.clear()
}

function resetAnimationMockState() {
  animationOutcomeQueue.length = 0
  pendingAnimations.length = 0
  animationCalls.length = 0
  selectorClientSizes.clear()
  selectorRects.clear()
  resizeObservers.clear()
}

function setImageSequence(url: string, outcomes: MockImageOutcome[]) {
  imageOutcomeSequences.set(url, [...outcomes])
}

function consumeAnimationOutcome(): MockAnimationOutcome {
  return animationOutcomeQueue.shift() ?? 'finish'
}

function setAnimationSequence(outcomes: MockAnimationOutcome[]) {
  animationOutcomeQueue.splice(0, animationOutcomeQueue.length, ...outcomes)
}

function resolvePendingAnimation() {
  const animation = pendingAnimations.shift()

  if (!animation) {
    throw new Error('No pending animation request found')
  }

  queueImageResult(animation.finish)
}

function getAnimationCalls(): MockAnimationCall[] {
  return [...animationCalls]
}

function getPendingAnimationCount(): number {
  return pendingAnimations.length
}

function setElementRect(element: HTMLElement, rect: DOMRectInit) {
  elementRects.set(element, DOMRect.fromRect(rect))
}

function setSelectorRect(selector: string, rect: DOMRectInit) {
  selectorRects.set(selector, DOMRect.fromRect(rect))
}

function setSelectorClientSize(selector: string, size: { width: number, height: number }) {
  selectorClientSizes.set(selector, size)
}

function triggerResizeObservers() {
  for (const observer of resizeObservers)
    observer.trigger()
}

function resolvePendingImage(url: string, outcome: Exclude<MockImageOutcome, 'pending'> = 'load') {
  const requests = pendingImageRequests.get(url)
  const request = requests?.shift()

  if (!request) {
    throw new Error(`No pending image request found for ${url}`)
  }

  if (!requests?.length)
    pendingImageRequests.delete(url)

  queueImageResult(() => {
    if (outcome === 'load')
      request.load()
    else
      request.error()
  })
}

function getImageRequestCount(url: string): number {
  return imageRequestCounts.get(url) ?? 0
}

if (!HTMLElement.prototype.animate) {
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value(this: HTMLElement, keyframes: PropertyIndexedKeyframes | Keyframe[], options?: number | KeyframeAnimationOptions) {
      const normalizedKeyframes = Array.isArray(keyframes) ? [...keyframes] : [keyframes]
      const normalizedOptions = typeof options === 'number' ? { duration: options } : (options ?? {})

      animationCalls.push({
        element: this,
        keyframes: normalizedKeyframes as Keyframe[],
        options: normalizedOptions,
      })

      const outcome = consumeAnimationOutcome()

      if (outcome === 'finish') {
        return {
          cancel() {},
          commitStyles() {},
          finished: Promise.resolve(),
        }
      }

      let rejectFinished: ((reason?: unknown) => void) | null = null
      let resolveFinished: (() => void) | null = null

      const finished = new Promise<void>((resolve, reject) => {
        resolveFinished = resolve
        rejectFinished = reject
      })

      const request = {
        cancel: () => rejectFinished?.(new DOMException('Animation aborted', 'AbortError')),
        finish: () => resolveFinished?.(),
      }

      pendingAnimations.push(request)

      return {
        cancel() {
          const animationIndex = pendingAnimations.indexOf(request)

          if (animationIndex >= 0)
            pendingAnimations.splice(animationIndex, 1)

          request.cancel()
        },
        commitStyles() {},
        finished,
      }
    },
  })
}

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value(this: HTMLElement) {
    const elementRect = elementRects.get(this)
    if (elementRect)
      return elementRect

    for (const [selector, rect] of selectorRects) {
      if (this.matches(selector))
        return rect
    }

    if (this.classList.contains('hana-img-viewer-overlay')) {
      return DOMRect.fromRect({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    return createRect()
  },
})

Object.defineProperties(HTMLElement.prototype, {
  clientHeight: {
    configurable: true,
    get(this: HTMLElement) {
      for (const [selector, size] of selectorClientSizes) {
        if (this.matches(selector))
          return size.height
      }
      return 0
    },
  },
  clientWidth: {
    configurable: true,
    get(this: HTMLElement) {
      for (const [selector, size] of selectorClientSizes) {
        if (this.matches(selector))
          return size.width
      }
      return 0
    },
  },
})

if (!HTMLElement.prototype.setPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value(this: HTMLElement, pointerId: number) {
      const captures = pointerCaptures.get(this) ?? new Set<number>()
      captures.add(pointerId)
      pointerCaptures.set(this, captures)
    },
  })
}

if (!HTMLElement.prototype.releasePointerCapture) {
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value(this: HTMLElement, pointerId: number) {
      pointerCaptures.get(this)?.delete(pointerId)
    },
  })
}

if (!window.ResizeObserver) {
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    value: MockResizeObserver,
  })
}

class MockImage {
  onload: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  private _src = ''

  get src(): string {
    return this._src
  }

  set src(value: string) {
    this._src = value
    incrementImageRequestCount(value)

    const outcome = consumeImageOutcome(value)
    const request = {
      error: () => this.onerror?.(new Event('error')),
      load: () => this.onload?.(new Event('load')),
    }

    if (outcome === 'pending') {
      pushPendingImageRequest(value, request)
      return
    }

    queueImageResult(() => {
      if (outcome === 'load')
        request.load()
      else
        request.error()
    })
  }

  decode(): Promise<void> {
    return Promise.resolve()
  }
}

Object.defineProperty(window, 'Image', {
  configurable: true,
  value: MockImage,
})

afterEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  addEventListenerSpy.mockClear()
  removeEventListenerSpy.mockClear()
  resetImageMockState()
  resetAnimationMockState()
  elementRects.clear()
  pointerCaptures.clear()
})

export {
  addEventListenerSpy,
  getAnimationCalls,
  getImageRequestCount,
  getPendingAnimationCount,
  removeEventListenerSpy,
  resolvePendingAnimation,
  resolvePendingImage,
  setAnimationSequence,
  setElementRect,
  setImageSequence,
  setSelectorClientSize,
  setSelectorRect,
  triggerResizeObservers,
}
