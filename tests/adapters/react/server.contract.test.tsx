import { defineServerContract } from '../../contracts/server/define-server-contract'
import { reactServerAdapter } from './server.adapter'

defineServerContract(reactServerAdapter)
