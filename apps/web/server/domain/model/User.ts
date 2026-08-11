import type { CollegeMajor } from './CollegeMajor'

export type User = {
  id: string
  serviceUserId: string
  nickname: string
  name: string
  phone: string
  email: string
  // 학번
  admissionClass: number | null
  collegeMajor: CollegeMajor | null
}
