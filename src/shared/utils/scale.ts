import { Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

const BASE_WIDTH = 390
const BASE_HEIGHT = 844

export const s = (size: number) => (width / BASE_WIDTH) * size
export const vs = (size: number) => (height / BASE_HEIGHT) * size
export const ms = (size: number, factor = 0.5) => size + (s(size) - size) * factor
export const mvs = (size: number, factor = 0.5) => size + (vs(size) - size) * factor
