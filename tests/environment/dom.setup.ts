import { afterEach, vi } from 'vitest'

export type MockImageOutcome = 'load' | 'error' | 'pending'
export type MockAnimationOutcome = 'finish' | 'pending'

interface PendingAnimationRequest {
  cancel: () => void
  finish: () => void
}

export interface MockAnimationCall {
  element: HTMLElement
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
}

const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
const imageOutcomeSequences = new Map<string, MockImageOutcome[]>()
const pendingImageRequests = new Map<string, Array<{ error: () => void, load: () => void }>>()
const imageRequestCounts = new Map<string, number>()
const animationOutcomeQueue: MockAnimationOutcome[] = []
const pendingAnimations: PendingAnimationRequest[] = []
const animationCalls: MockAnimationCall[] = []
let elementRects = new WeakMap<HTMLElement, DOMRect>()
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

const queueResult = (callback: () => void) => queueMicrotask(callback)

const consumeImageOutcome = (url: string): MockImageOutcome => {
  const sequence = imageOutcomeSequences.get(url)
  if (!sequence?.length)
    return 'load'
  const outcome = sequence.shift() ?? 'load'
  if (sequence.length === 0)
    imageOutcomeSequences.delete(url)
  return outcome
}

const resetImageState = () => {
  imageOutcomeSequences.clear()
  pendingImageRequests.clear()
  imageRequestCounts.clear()
}

const resetAnimationState = () => {
  animationOutcomeQueue.length = 0
  pendingAnimations.length = 0
  animationCalls.length = 0
  elementRects = new WeakMap<HTMLElement, DOMRect>()
  selectorRects.clear()
  selectorClientSizes.clear()
  resizeObservers.clear()
}

const getDefaultRect = () => DOMRect.fromRect({ x: 24, y: 24, width: 160, height: 120 })

const consumeAnimationOutcome = () => animationOutcomeQueue.shift() ?? 'finish'

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
      if (consumeAnimationOutcome() === 'finish') {
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
      const request: PendingAnimationRequest = {
        cancel: () => rejectFinished?.(new DOMException('Animation aborted', 'AbortError')),
        finish: () => resolveFinished?.(),
      }
      pendingAnimations.push(request)
      return {
        cancel() {
          const index = pendingAnimations.indexOf(request)
          if (index >= 0)
            pendingAnimations.splice(index, 1)
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
    const ownRect = elementRects.get(this)
    if (ownRect)
      return ownRect
    for (const [selector, rect] of selectorRects) {
      if (this.matches(selector))
        return rect
    }
    if (this.classList.contains('hana-img-viewer-overlay')) {
      return DOMRect.fromRect({ width: window.innerWidth, height: window.innerHeight })
    }
    return getDefaultRect()
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

if (!window.requestAnimationFrame) {
  Object.defineProperties(window, {
    cancelAnimationFrame: {
      configurable: true,
      value: (id: number) => window.clearTimeout(id),
    },
    requestAnimationFrame: {
      configurable: true,
      value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0),
    },
  })
}

if (!window.ResizeObserver)
  Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: MockResizeObserver })

const createPointerEvent = (type: string, init: PointerEventInit): PointerEvent => {
  const event = new MouseEvent(type, init) as PointerEvent
  Object.defineProperties(event, {
    pointerId: { configurable: true, value: init.pointerId ?? 1 },
    pointerType: { configurable: true, value: init.pointerType ?? 'mouse' },
  })
  return event
}

const createTouchEvent = (type: string, touches: Array<{ clientX: number, clientY: number }>): TouchEvent => {
  const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent
  Object.defineProperty(event, 'touches', {
    configurable: true,
    value: touches.map((touch, identifier) => ({ ...touch, identifier })),
  })
  return event
}

class MockImage {
  onload: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  private currentSrc = ''

  get src() {
    return this.currentSrc
  }

  set src(value: string) {
    this.currentSrc = value
    imageRequestCounts.set(value, (imageRequestCounts.get(value) ?? 0) + 1)
    const outcome = consumeImageOutcome(value)
    const request = {
      error: () => this.onerror?.(new Event('error')),
      load: () => this.onload?.(new Event('load')),
    }
    if (outcome === 'pending') {
      const requests = pendingImageRequests.get(value) ?? []
      requests.push(request)
      pendingImageRequests.set(value, requests)
      return
    }
    queueResult(outcome === 'load' ? request.load : request.error)
  }

  decode() {
    return Promise.resolve()
  }
}

Object.defineProperty(window, 'Image', { configurable: true, value: MockImage })

const setImageSequence = (url: string, outcomes: MockImageOutcome[]) => imageOutcomeSequences.set(url, [...outcomes])
const getImageRequestCount = (url: string) => imageRequestCounts.get(url) ?? 0
const resolvePendingImage = (url: string, outcome: Exclude<MockImageOutcome, 'pending'> = 'load') => {
  const requests = pendingImageRequests.get(url)
  const request = requests?.shift()
  if (!request)
    throw new Error(`No pending image request found for ${url}`)
  if (!requests?.length)
    pendingImageRequests.delete(url)
  queueResult(outcome === 'load' ? request.load : request.error)
}
const setAnimationSequence = (outcomes: MockAnimationOutcome[]) => animationOutcomeQueue.splice(0, animationOutcomeQueue.length, ...outcomes)
const getPendingAnimationCount = () => pendingAnimations.length
const resolvePendingAnimation = () => {
  const request = pendingAnimations.shift()
  if (!request)
    throw new Error('No pending animation request found')
  queueResult(request.finish)
}
const getAnimationCalls = () => [...animationCalls]
const setElementRect = (element: HTMLElement, rect: DOMRectInit) => elementRects.set(element, DOMRect.fromRect(rect))
const setSelectorRect = (selector: string, rect: DOMRectInit) => selectorRects.set(selector, DOMRect.fromRect(rect))
const setSelectorClientSize = (selector: string, size: { width: number, height: number }) => selectorClientSizes.set(selector, size)
const triggerResizeObservers = () => {
  for (const observer of resizeObservers)
    observer.trigger()
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  addEventListenerSpy.mockClear()
  removeEventListenerSpy.mockClear()
  resetImageState()
  resetAnimationState()
  pointerCaptures.clear()
})

export {
  addEventListenerSpy,
  createPointerEvent,
  createTouchEvent,
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
