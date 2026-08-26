export interface HanaImgViewerProps {
  /** Thumbnail and initial preview source. */
  src: string
  /** HTML element used for the visible thumbnail root. @default 'div' */
  as?: keyof HTMLElementTagNameMap
  /** Higher-quality source that silently replaces `src` after loading. */
  previewSrc?: string
  /** Alternative text for both images. @default '' */
  alt?: string
  /** Controlled desired visibility. Controlled mode is fixed at mount. */
  open?: boolean
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
}
