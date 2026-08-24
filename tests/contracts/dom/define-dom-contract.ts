import type { DomAdapter } from './adapter'
import { registerB1OpenClose } from './behaviors/b01-open-close'
import { registerB2VisibilityOwnership } from './behaviors/b02-visibility-ownership'
import { registerB3WheelZoom } from './behaviors/b03-wheel-zoom'
import { registerB4PinchOwnership } from './behaviors/b04-pinch-ownership'
import { registerB5PointerDrag } from './behaviors/b05-pointer-drag'
import { registerB6DoubleClickReset } from './behaviors/b06-double-click-reset'
import { registerB7TransitionOwnership } from './behaviors/b07-transition-ownership'
import { registerB8SourceReplacement } from './behaviors/b08-source-replacement'
import { registerB9SourceEnhancement } from './behaviors/b09-source-enhancement'
import { registerB10FocusDismissal } from './behaviors/b10-focus-dismissal'
import { registerB11ContainerLifecycle } from './behaviors/b11-container-lifecycle'
import { registerB12BodyLock } from './behaviors/b12-body-lock'

export const defineDomContract = (adapter: DomAdapter) => {
  registerB1OpenClose(adapter)
  registerB2VisibilityOwnership(adapter)
  registerB3WheelZoom(adapter)
  registerB4PinchOwnership(adapter)
  registerB5PointerDrag(adapter)
  registerB6DoubleClickReset(adapter)
  registerB7TransitionOwnership(adapter)
  registerB8SourceReplacement(adapter)
  registerB9SourceEnhancement(adapter)
  registerB10FocusDismissal(adapter)
  registerB11ContainerLifecycle(adapter)
  registerB12BodyLock(adapter)
}
