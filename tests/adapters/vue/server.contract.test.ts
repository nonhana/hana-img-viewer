import { defineServerContract } from '../../contracts/server/define-server-contract'
import { vueServerAdapter } from './server.adapter'

defineServerContract(vueServerAdapter)
