import { defineHydrationContract } from '../../contracts/hydration/define-hydration-contract'
import { reactHydrationAdapter } from './hydration.adapter'

defineHydrationContract(reactHydrationAdapter)
