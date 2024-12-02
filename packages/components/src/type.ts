import { ExtractPropTypes } from 'vue'

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
  src: { type: String, required: true } as const,
  alt: String,
  width: [String, Number],
  height: [String, Number],

  duration: { type: Number, default: defaultImgViewerProps.duration },
  maskBgColor: { type: String, default: defaultImgViewerProps.maskBgColor },
  maskOpacity: { type: Number, default: defaultImgViewerProps.maskOpacity },
  previewZIndex: { type: Number, default: defaultImgViewerProps.previewZIndex },
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
}

export type ImgViewerProps = ExtractPropTypes<typeof imgViewerPropsObj>