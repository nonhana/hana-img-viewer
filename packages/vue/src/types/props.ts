import type { PortalTarget } from 'hana-img-viewer-core'
import type { HTMLAttributes, StyleValue } from 'vue'

export type { PortalTarget }

/**
 * Public component props.
 *
 * Keep the surface intentionally small:
 * - `src` is the canonical thumbnail + first-preview source
 * - `previewSrc` is a silent enhancement path
 * - `open` controls visibility
 * - `portalTarget` controls where the overlay mounts on the client
 */
export interface HanaImgViewerProps {
  /**
   * Thumbnail and initial preview source.
   */
  src: string
  alt?: string
  /**
   * Optional higher-quality source that upgrades the preview in-place
   * after it is ready.
   */
  previewSrc?: string
  open?: boolean
  /**
   * Client-side overlay mount target.
   *
   * - Omitted or `'body'` mounts into `document.body`
   * - `null` keeps the open request pending until a custom target is ready
   * - Other string values are treated as CSS selectors
   * - `HTMLElement` values are used directly
   */
  portalTarget?: PortalTarget
  enableZoom?: boolean
  enableDrag?: boolean
  minZoom?: number
  maxZoom?: number
  closeOnMaskClick?: boolean
  /**
   * Allow closing the viewer with the Escape key when the viewer owns the
   * active body portal. Custom portal targets keep the host as the final ESC
   * authority unless explicitly delegated.
   * @default true
   */
  enableKeyboard?: boolean
  containerClass?: HTMLAttributes['class']
  containerStyle?: StyleValue
  thumbnailClass?: HTMLAttributes['class']
  thumbnailStyle?: StyleValue
}

type DefaultPropsShape = Required<Pick<
  HanaImgViewerProps,
  | 'alt'
  | 'enableZoom'
  | 'enableDrag'
  | 'minZoom'
  | 'maxZoom'
  | 'closeOnMaskClick'
  | 'enableKeyboard'
>>

export const defaultProps = {
  alt: '',
  enableZoom: true,
  enableDrag: true,
  minZoom: 0.5,
  maxZoom: 10,
  closeOnMaskClick: true,
  enableKeyboard: true,
} as const satisfies DefaultPropsShape
