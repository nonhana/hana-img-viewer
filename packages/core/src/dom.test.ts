import { afterEach, describe, expect, it } from 'vitest'
import { resolvePortalTarget } from './dom'

// The core suite runs in a node environment; these stubs let us exercise
// the browser-facing branches (body/selector resolution) without a DOM
// implementation. Real-world behavior of `querySelector` (including its
// SyntaxError on invalid selectors) is covered by the component suites.
interface DomStub {
  body: HTMLElement
  querySelector: (selector: string) => HTMLElement | null
}

const fakeBody = {} as HTMLElement
const fakeMatch = {} as HTMLElement

const originalWindow = globalThis.window
const originalDocument = globalThis.document
const originalHTMLElement = globalThis.HTMLElement

class FakeHTMLElement {}

const installDom = (stub: DomStub): void => {
  globalThis.window = {} as Window & typeof globalThis
  globalThis.HTMLElement = FakeHTMLElement as typeof HTMLElement
  globalThis.document = {
    body: stub.body,
    querySelector: stub.querySelector,
  } as Document
}

const restoreDom = (): void => {
  if (originalWindow === undefined) {
    delete (globalThis as Partial<typeof globalThis> & { window?: unknown }).window
  }
  else {
    globalThis.window = originalWindow
  }

  if (originalDocument === undefined) {
    delete (globalThis as Partial<typeof globalThis> & { document?: unknown }).document
  }
  else {
    globalThis.document = originalDocument
  }

  if (originalHTMLElement === undefined) {
    delete (globalThis as Partial<typeof globalThis> & { HTMLElement?: unknown }).HTMLElement
  }
  else {
    globalThis.HTMLElement = originalHTMLElement
  }
}

afterEach(restoreDom)

describe('resolvePortalTarget without a window (SSR)', () => {
  it('resolves to null without throwing for any input shape', () => {
    expect(resolvePortalTarget(undefined)).toBeNull()
    expect(resolvePortalTarget('body')).toBeNull()
    expect(resolvePortalTarget('')).toBeNull()
    expect(resolvePortalTarget('[')).toBeNull()
    expect(resolvePortalTarget(null)).toBeNull()
  })
})

describe('resolvePortalTarget with a window', () => {
  it('resolves undefined, "body" and document.body to document.body', () => {
    installDom({ body: fakeBody, querySelector: () => null })

    expect(resolvePortalTarget(undefined)).toBe(fakeBody)
    expect(resolvePortalTarget('body')).toBe(fakeBody)
    expect(resolvePortalTarget(fakeBody)).toBe(fakeBody)
  })

  it('resolves null to null', () => {
    installDom({ body: fakeBody, querySelector: () => null })

    expect(resolvePortalTarget(null)).toBeNull()
  })

  it('resolves a matching selector to the element', () => {
    installDom({
      body: fakeBody,
      querySelector: selector => (selector === '#app' ? fakeMatch : null),
    })

    expect(resolvePortalTarget('#app')).toBe(fakeMatch)
  })

  it('resolves a missing selector to null without querying twice', () => {
    const querySelector = (): HTMLElement | null => null
    installDom({ body: fakeBody, querySelector })

    expect(resolvePortalTarget('#does-not-exist')).toBeNull()
  })

  it('returns null for a blank selector without calling querySelector', () => {
    const querySelector = (): HTMLElement | null => {
      throw new Error('querySelector must not run for blank input')
    }
    installDom({ body: fakeBody, querySelector })

    expect(resolvePortalTarget('')).toBeNull()
    expect(resolvePortalTarget('   ')).toBeNull()
  })

  it('returns null instead of throwing when querySelector rejects an invalid selector', () => {
    installDom({
      body: fakeBody,
      querySelector: () => {
        throw new DOMException('Failed to parse selector', 'SyntaxError')
      },
    })

    expect(resolvePortalTarget('[')).toBeNull()
    expect(resolvePortalTarget(':')).toBeNull()
  })

  it('returns null for a non-element, non-string target', () => {
    installDom({ body: fakeBody, querySelector: () => null })

    expect(resolvePortalTarget(42 as never)).toBeNull()
  })
})
