import type { DistributionAdapter } from './adapter'
import { registerB14Distribution } from './b14-distribution'

export const defineDistributionContract = (adapter: DistributionAdapter) => {
  registerB14Distribution(adapter)
}
