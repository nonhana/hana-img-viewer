import type { ExtractPropTypes } from 'vue'

export const defaultImgViewerProps = {
  duration: 500,
  maskBgColor: 'black',
  maskOpacity: 0.1,
  previewZIndex: 1000,
  previewMaxWidth: '80vw',
  previewMaxHeight: '80vh',
  zoomStep: 0.2,
  zoomMin: 0.2,
  zoomMax: 10,
  dblClickZoom: true,
  dblClickZoomTo: 2,
}

export const imgViewerPropsObj = {
  /** Required. Image URL. */
  src: { type: String, required: true } as const,
  /** Alternative text describing the image. */
  alt: String,
  /** Image width. */
  width: [String, Number],
  /** Image height. */
  height: [String, Number],

  /** Transition animation duration (ms). */
  duration: { type: Number, default: defaultImgViewerProps.duration },
  /** Mask background color. */
  maskBgColor: { type: String, default: defaultImgViewerProps.maskBgColor },
  /** Mask opacity (0-1). */
  maskOpacity: { type: Number, default: defaultImgViewerProps.maskOpacity },
  /** z-index of the preview layer. */
  previewZIndex: { type: Number, default: defaultImgViewerProps.previewZIndex },
  /** Max width of the preview area. */
  previewMaxWidth: {
    type: [String, Number],
    default: defaultImgViewerProps.previewMaxWidth,
  },
  /** Max height of the preview area. */
  previewMaxHeight: {
    type: [String, Number],
    default: defaultImgViewerProps.previewMaxHeight,
  },

  /** Zoom step, the increment ratio for scaling. */
  zoomStep: { type: Number, default: defaultImgViewerProps.zoomStep },
  /** Minimum zoom ratio. */
  zoomMin: { type: Number, default: defaultImgViewerProps.zoomMin },
  /** Maximum zoom ratio. */
  zoomMax: { type: Number, default: defaultImgViewerProps.zoomMax },
  /** Enable double-click zoom. */
  dblClickZoom: { type: Boolean, default: defaultImgViewerProps.dblClickZoom },
  /** Target zoom ratio for double-click. */
  dblClickZoomTo: {
    type: Number,
    default: defaultImgViewerProps.dblClickZoomTo,
  },
}

export type ImgViewerProps = ExtractPropTypes<typeof imgViewerPropsObj>
