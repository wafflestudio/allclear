import { buildAppDeepLinkUrl } from '../club/openInApp'

const MANAGER_TRANSFER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
const ALLOWED_WEB_HOSTS = new Set(['all-clear.cc', 'dev.all-clear.cc'])

export const parseManagerTransferToken = (value: unknown): string | null =>
  typeof value === 'string' && MANAGER_TRANSFER_TOKEN_PATTERN.test(value) ? value : null

export const buildManagerTransferDeepPath = (token: string): string =>
  `manager-transfer/${encodeURIComponent(token)}`

export const buildManagerTransferAppUrl = (token: string): string =>
  buildAppDeepLinkUrl(buildManagerTransferDeepPath(token))

export const buildManagerTransferWebUrl = (token: string, requestHost: string): string => {
  const normalizedHost = requestHost.split(':')[0].toLowerCase()
  const host = ALLOWED_WEB_HOSTS.has(normalizedHost) ? normalizedHost : 'all-clear.cc'
  return `https://${host}/manager-transfer/${encodeURIComponent(token)}`
}

export const shouldAutomaticallyOpenManagerTransfer = (
  token: string,
  automaticallyAttemptedToken: string | null,
): boolean => token !== automaticallyAttemptedToken
