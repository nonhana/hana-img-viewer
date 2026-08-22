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
const pendingImageRequests = new Map<
  string,
  Array<{
    error: () => void
    load: () => void
  }>
>()
const imageRequestCounts = new Map<string, number>()
const animationOutcomeQueue: MockAnimationOutcome[] = []
const pendingAnimations: PendingAnimationRequest[] = []
const animationCalls: MockAnimationCall[] = []

function createRect(): DOMRect {
  return DOMRect.fromRect({
    x: 24,
    y: 24,
    width: 160,
    height: 120,
  })
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

function queueImageResult(callback: () => void): void {
  queueMicrotask(callback)
}

function pushPendingImageRequest(
  url: string,
  request: {
    error: () => void
    load: () => void
  },
): void {
  const requests = pendingImageRequests.get(url) ?? []
  requests.push(request)
  pendingImageRequests.set(url, requests)
}

function incrementImageRequestCount(url: string): void {
  imageRequestCounts.set(url, (imageRequestCounts.get(url) ?? 0) + 1)
}

function resetImageMockState(): void {
  imageOutcomeSequences.clear()
  pendingImageRequests.clear()
  imageRequestCounts.clear()
}

function resetAnimationMockState(): void {
  animationOutcomeQueue.length = 0
  pendingAnimations.length = 0
  animationCalls.length = 0
}

function setImageSequence(url: string, outcomes: MockImageOutcome[]): void {
  imageOutcomeSequences.set(url, [...outcomes])
}

function consumeAnimationOutcome(): MockAnimationOutcome {
  return animationOutcomeQueue.shift() ?? 'finish'
}

function setAnimationSequence(outcomes: MockAnimationOutcome[]): void {
  animationOutcomeQueue.splice(0, animationOutcomeQueue.length, ...outcomes)
}

function resolvePendingAnimation(): void {
  const animation = pendingAnimations.shift()

  if (!animation) {
    throw new Error('No pending animation request found')
  }

  queueImageResult(animation.finish)
}

function getAnimationCalls(): MockAnimationCall[] {
  return [...animationCalls]
}

function resolvePendingImage(
  url: string,
  outcome: Exclude<MockImageOutcome, 'pending'> = 'load',
): void {
  const requests = pendingImageRequests.get(url)

  if (!requests?.length) {
    throw new Error(`No pending image request found for ${url}`)
  }

  const request = requests.shift()!

  if (!requests.length)
    pendingImageRequests.delete(url)

  queueImageResult(() => {
    if (outcome === 'load')
      request.load()
    else request.error()
  })
}

function getImageRequestCount(url: string): number {
  return imageRequestCounts.get(url) ?? 0
}

if (!HTMLElement.prototype.animate) {
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value(
      this: HTMLElement,
      keyframes: PropertyIndexedKeyframes | Keyframe[],
      options?: number | KeyframeAnimationOptions,
    ) {
      const normalizedKeyframes = Array.isArray(keyframes)
        ? [...keyframes]
        : [keyframes]
      const normalizedOptions
        = typeof options === 'number' ? { duration: options } : (options ?? {})

      animationCalls.push({
        element: this,
        keyframes: normalizedKeyframes as Keyframe[],
        options: normalizedOptions,
      })

      const outcome = consumeAnimationOutcome()

      if (outcome === 'finish') {
        return {
          cancel() {
            /* no-op: mock animation contract */
          },
          commitStyles() {
            /* no-op */
          },
          finished: Promise.resolve(),
        }
      }

      let rejectFinished: ((reason?: unknown) => void) | null = null
      let resolveFinished: (() => void) | null = null

      const finished = Promise.withResolvers<void>()
      resolveFinished = finished.resolve
      rejectFinished = finished.reject

      const request = {
        cancel: () =>
          rejectFinished?.(new DOMException('Animation aborted', 'AbortError')),
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
        commitStyles() {
          /* no-op */
        },
        finished: finished.promise,
      }
    },
  })
}

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value() {
    return createRect()
  },
})

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
      else request.error()
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
})

export {
  addEventListenerSpy,
  getAnimationCalls,
  getImageRequestCount,
  removeEventListenerSpy,
  resolvePendingAnimation,
  resolvePendingImage,
  setAnimationSequence,
  setImageSequence,
}
