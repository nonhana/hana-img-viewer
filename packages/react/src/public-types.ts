import type { CSSProperties, ReactNode } from 'react'

/** Public props for the React image viewer. */
export interface HanaImgViewerProps {
  /** Thumbnail and initial preview source. */
  src: string
  /** Higher-quality source that silently replaces `src` after loading. */
  previewSrc?: string
  /** Alternative text for both images. @default '' */
  alt?: string
  /** Controlled desired visibility. Controlled mode is fixed at mount. */
  open?: boolean
  /** Initial visibility for uncontrolled usage. @default false */
  defaultOpen?: boolean
  /** Called once when the viewer requests a desired-visibility change. */
  onOpenChange?: (open: boolean) => void
  /**
   * Overlay mount container. Omission resolves to `document.body` after
   * hydration; explicit `null` keeps an open request pending.
   */
  container?: HTMLElement | null
  /** Enable wheel, pinch, and double-click zoom. @default true */
  enableZoom?: boolean
  /** Minimum zoom. Callers must keep `0 < minZoom <= maxZoom`. @default 0.5 */
  minZoom?: number
  /** Maximum zoom. @default 10 */
  maxZoom?: number
  /** Close when the backdrop is clicked. @default true */
  closeOnBackdropClick?: boolean
  /** Close when the focused overlay receives Escape. @default true */
  closeOnEscape?: boolean
  /** Class applied to the visible thumbnail root. */
  className?: string
  /** Style applied to the visible thumbnail root. */
  style?: CSSProperties
  /** Custom trigger. The consumer owns its semantics, focus, and styling. */
  children?: (controls: { open: () => void }) => ReactNode
}
