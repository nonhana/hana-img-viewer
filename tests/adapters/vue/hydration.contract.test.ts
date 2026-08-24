import { defineHydrationContract } from '../../contracts/hydration/define-hydration-contract'
import { vueHydrationAdapter } from './hydration.adapter'

defineHydrationContract(vueHydrationAdapter)
