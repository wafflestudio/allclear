import type { NextApiResponse } from 'next'
import { BadRequestError, TooManyRequestsError, UnauthorizedError } from 'server/domain/error'
import type { ClubSearchResponse, SearchClub } from 'server/service/search/search.types'

type ResponseData = {
  clubs: SearchClub[]
  totalSize: number
  query: string
  correctedQuery: string | null
  isTypoCorrected: boolean
}

export type SearchApiResponse = NextApiResponse<ResponseData | string>

// 두 검색 API가 함께 쓰는 응답입니다.
export function sendSearchResult(
  res: SearchApiResponse,
  query: string,
  result: ClubSearchResponse,
) {
  return res.status(200).json({
    clubs: result.clubs,
    totalSize: result.clubs.length,
    query,
    correctedQuery: result.correctedQuery,
    isTypoCorrected: result.isTypoCorrected,
  })
}

export function sendMethodNotAllowed(res: SearchApiResponse) {
  res.setHeader('Allow', 'GET')
  return res.status(405).send('Method Not Allowed')
}

export function sendError(res: SearchApiResponse, err: unknown) {
  if (err instanceof UnauthorizedError) {
    return res.status(401).send('unauthorized')
  }
  if (err instanceof BadRequestError) {
    return res.status(400).send(err.message)
  }
  if (err instanceof TooManyRequestsError) {
    res.setHeader('Retry-After', err.retryAfterSeconds)
    return res.status(429).send(err.message)
  }

  console.error('searchClubs error: ', err)
  return res.status(500).send('Internal Server Error')
}
