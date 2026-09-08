const SEOUL_TIME_ZONE = 'Asia/Seoul'
const FIRST_SEMESTER_START_MONTH = 3
const SECOND_SEMESTER_START_MONTH = 9

export type OfficialVerificationTermKey = `${number}-${1 | 2}`

const getSeoulYearAndMonth = (date: Date): { year: number; month: number } => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error('failed to calculate official verification term')
  }

  return { year, month }
}

export const getOfficialVerificationTermKey = (date = new Date()): OfficialVerificationTermKey => {
  const { year, month } = getSeoulYearAndMonth(date)

  if (month < FIRST_SEMESTER_START_MONTH) {
    return `${year - 1}-2`
  }

  if (month < SECOND_SEMESTER_START_MONTH) {
    return `${year}-1`
  }

  return `${year}-2`
}
