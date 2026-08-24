import { defineDistributionContract } from '../../contracts/distribution/define-distribution-contract'
import { reactDistributionAdapter } from './distribution.adapter'

defineDistributionContract(reactDistributionAdapter)
