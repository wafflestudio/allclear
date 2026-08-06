export type User = {
  id: string
  serviceUserId: string
  nickname: string
  name: string
  phone: string
  email: string
  gender: string
  birthDate: string | null
  birthYear: string
  college: string
  major: string
  // 학번
  admissionClass: number | null
  // 학년
  grade: number | null
}
