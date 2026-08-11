import type { CollegeMajor } from './CollegeMajor'

type UserBase = {
  id: string
  serviceUserId: string
  nickname: string
  name: string
  phone: string
  email: string
  gender: string
  birthDate: string | null
  birthYear: string
  // 학번
  admissionClass: number | null
  // 학년
  grade: number | null
}

export type LegacyUser = UserBase & {
  college: string
  major: string
}

export type User = LegacyUser & {
  collegeMajor: CollegeMajor | null
}
