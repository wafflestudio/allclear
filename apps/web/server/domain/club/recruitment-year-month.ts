export function formatYearMonth(date: Date | string): string {
  const parsedDate = date instanceof Date ? new Date(date.getTime()) : new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date for year_month')
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}
