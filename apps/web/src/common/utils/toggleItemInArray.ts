import { xor } from 'lodash-es'

export const toggleItemInArray = <T>(pool: T[], ...targets: T[]): T[] => xor(pool, targets)
