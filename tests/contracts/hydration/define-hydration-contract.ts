import type { HydrationAdapter } from './adapter'
import { registerB13Hydration } from './b13-hydration'

export const defineHydrationContract = (adapter: HydrationAdapter) => {
  registerB13Hydration(adapter)
}
