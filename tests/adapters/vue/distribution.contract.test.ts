import { defineDistributionContract } from '../../contracts/distribution/define-distribution-contract'
import { vueDistributionAdapter } from './distribution.adapter'

defineDistributionContract(vueDistributionAdapter)
