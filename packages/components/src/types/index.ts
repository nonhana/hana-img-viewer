import type { ExtractPropTypes } from 'vue'

export const defaultImgViewerProps = {
  duration: 500,
  maskBgColor: 'black',
  maskOpacity: 0.1,
  previewZIndex: 9999,
  autoZIndex: true,
  previewMaxWidth: '80vw',
  previewMaxHeight: '80vh',
  zoomStep: 0.2,
  zoomMin: 0.2,
  zoomMax: 10,
  dblClickZoom: true,
  dblClickZoomTo: 2,
  zoomFactorRad: 1,
}

export const imgViewerPropsObj = {
  displaying: { type: Boolean, default: undefined },
  applyingPreviewStyles: { type: Boolean, default: undefined },
  isAnimating: { type: Boolean, default: undefined },

  src: { type: String, required: true } as const,
  alt: String,
  width: [String, Number],
  height: [String, Number],

  duration: { type: Number, default: defaultImgViewerProps.duration },
  maskBgColor: { type: String, default: defaultImgViewerProps.maskBgColor },
  maskOpacity: { type: Number, default: defaultImgViewerProps.maskOpacity },
  previewZIndex: { type: Number, default: defaultImgViewerProps.previewZIndex },
  autoZIndex: { type: Boolean, default: defaultImgViewerProps.autoZIndex },
  previewMaxWidth: {
    type: [String, Number],
    default: defaultImgViewerProps.previewMaxWidth,
  },
  previewMaxHeight: {
    type: [String, Number],
    default: defaultImgViewerProps.previewMaxHeight,
  },

  zoomStep: { type: Number, default: defaultImgViewerProps.zoomStep },
  zoomMin: { type: Number, default: defaultImgViewerProps.zoomMin },
  zoomMax: { type: Number, default: defaultImgViewerProps.zoomMax },
  dblClickZoom: { type: Boolean, default: defaultImgViewerProps.dblClickZoom },
  dblClickZoomTo: {
    type: Number,
    default: defaultImgViewerProps.dblClickZoomTo,
  },
  zoomFactorRad: {
    type: Number,
    default: defaultImgViewerProps.zoomFactorRad,
  },
}

export type ImgViewerProps = ExtractPropTypes<typeof imgViewerPropsObj>

export const imgViewerEmitsObj = {
  'update:displaying': (_value: boolean) => true,
  'update:applyingPreviewStyles': (_value: boolean) => true,
  'update:isAnimating': (_value: boolean) => true,
  'displayChange': (_value: boolean) => true,
  'previewStylesChange': (_value: boolean) => true,
  'animatingChange': (_value: boolean) => true,
}

export type ImgViewerEmits = typeof imgViewerEmitsObj
