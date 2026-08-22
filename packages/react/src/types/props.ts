import type { PortalTarget } from 'hana-img-viewer-core'
import type { CSSProperties, ReactNode, Ref } from 'react'

export type { PortalTarget }

/**
 * Render props passed to the custom `thumbnail` renderer.
 */
export interface ThumbnailRenderProps {
  open: () => void
}

export type ThumbnailRenderer = (
  renderProps: ThumbnailRenderProps,
) => ReactNode

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
  containerClass?: string
  containerStyle?: CSSProperties
  thumbnailClass?: string
  thumbnailStyle?: CSSProperties
  thumbnail?: ThumbnailRenderer
  onOpenChange?: (value: boolean) => void
  onOpen?: () => void
  onClose?: () => void
  onLoad?: (event: Event) => void
  onError?: (event: Event) => void
  /**
   * Imperative handle (React 19 ref-as-prop).
   */
  ref?: Ref<HanaImgViewerHandle>
}

/**
 * Imperative methods exposed through the `ref` prop.
 */
export interface HanaImgViewerHandle {
  open: () => Promise<void> | void
  close: () => Promise<void> | void
  reset: () => void
}

type DefaultPropsShape = Required<
  Pick<
    HanaImgViewerProps,
    | 'alt'
    | 'enableZoom'
    | 'enableDrag'
    | 'minZoom'
    | 'maxZoom'
    | 'closeOnMaskClick'
    | 'enableKeyboard'
  >
>

export const defaultProps = {
  alt: '',
  enableZoom: true,
  enableDrag: true,
  minZoom: 0.5,
  maxZoom: 10,
  closeOnMaskClick: true,
  enableKeyboard: true,
} as const satisfies DefaultPropsShape
