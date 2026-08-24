import type { ServerAdapter } from './adapter'
import { registerB13ServerRender } from './b13-server-render'

export const defineServerContract = (adapter: ServerAdapter) => {
  registerB13ServerRender(adapter)
}
