export function isTestApiEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
}
