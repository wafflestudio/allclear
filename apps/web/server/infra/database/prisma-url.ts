/** Build the PostgreSQL connection URL from the shared DB_* settings. */
export function getPrismaDatabaseUrl(): string {
  const url = new URL('postgresql://localhost')
  url.hostname = process.env.DB_HOST ?? 'localhost'
  url.port = process.env.DB_PORT ?? '5432'
  url.username = process.env.DB_USERNAME ?? 'postgres'
  url.password = process.env.DB_PASSWORD ?? ''
  url.pathname = `/${encodeURIComponent(process.env.DB_NAME ?? 'postgres')}`
  return url.toString()
}
