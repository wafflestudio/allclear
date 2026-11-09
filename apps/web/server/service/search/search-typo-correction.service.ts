import { disassemble } from 'es-hangul'
import leven from 'leven'
import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'

type ClubCorrectionSource = { name: string; shortDescription: string | null }
type CorrectionCandidate = {
  term: string
  normalizedTerm: string
  decomposedTerm: string
}

@Service
export class SearchTypoCorrectionService {
  async findCorrectedQuery(query: string): Promise<string | null> {
    if (query.trim().length < 2) {
      return null
    }
    const normalizedQuery = this.normalizeSearchTerm(query)
    const decomposedQuery = this.decomposeToJamo(normalizedQuery)
    if (!decomposedQuery) {
      return null
    }

    const clubs = await getPrismaClient().club.findMany({
      select: { name: true, short_description: true },
      where: {
        status: PUBLIC_CLUB_STATUS,
        deleted_at: null,
      },
    })

    const candidateTerms = this.collectCorrectionCandidates(
      clubs.map((club) => ({ name: club.name, shortDescription: club.short_description })),
      normalizedQuery.length,
    )

    const bestCandidate = candidateTerms
      .map((candidate) => ({
        ...candidate,
        similarity: this.calculateJamoSimilarity(decomposedQuery, candidate.decomposedTerm),
        lengthDiff: Math.abs(candidate.decomposedTerm.length - decomposedQuery.length),
      }))
      .filter((it) => it.normalizedTerm !== normalizedQuery)
      .sort(
        (a, b) =>
          b.similarity - a.similarity ||
          a.lengthDiff - b.lengthDiff ||
          a.normalizedTerm.length - b.normalizedTerm.length,
      )[0]

    if (!bestCandidate) {
      return null
    }

    if (bestCandidate.similarity < this.minimumJamoSimilarity(decomposedQuery.length)) {
      return null
    }

    return bestCandidate.term
  }

  private normalizeSearchTerm(term: string): string {
    return term.trim().toLowerCase().replace(/\s+/g, '')
  }

  private decomposeToJamo(term: string): string {
    return disassemble(term).replace(/\s+/g, '')
  }

  private calculateJamoSimilarity(query: string, candidate: string): number {
    const maxLength = Math.max(query.length, candidate.length)
    if (maxLength === 0) {
      return 0
    }
    return 1 - leven(query, candidate) / maxLength
  }

  private minimumJamoSimilarity(jamoLength: number): number {
    if (jamoLength <= 4) {
      return 0.8
    }
    if (jamoLength <= 8) {
      return 0.75
    }
    return 0.7
  }

  private collectCorrectionCandidates(
    clubs: ClubCorrectionSource[],
    queryLength: number,
  ): CorrectionCandidate[] {
    const splitSearchTerms = (value: string | null | undefined) => {
      if (!value) {
        return []
      }

      return value
        .split(/[\s,./()[\]{}\-_:;!?'"`~|]+/g)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2)
    }

    const candidates = new Map<string, CorrectionCandidate>()
    const register = (term: string) => {
      const normalizedTerm = this.normalizeSearchTerm(term)
      const decomposedTerm = this.decomposeToJamo(normalizedTerm)
      if (!normalizedTerm || !decomposedTerm) {
        return
      }

      if (!candidates.has(normalizedTerm)) {
        candidates.set(normalizedTerm, {
          term: term.trim(),
          normalizedTerm,
          decomposedTerm,
        })
      }
    }

    const registerExpandedTerms = (value: string | null | undefined) => {
      for (const term of splitSearchTerms(value)) {
        register(term)

        if (term.length <= queryLength + 1) {
          continue
        }

        for (const windowLength of [queryLength, queryLength + 1]) {
          if (windowLength < 2 || windowLength > term.length) {
            continue
          }

          for (let start = 0; start + windowLength <= term.length; start += 1) {
            register(term.slice(start, start + windowLength))
          }
        }
      }
    }

    for (const club of clubs) {
      register(club.name)
      registerExpandedTerms(club.name)
      registerExpandedTerms(club.shortDescription)
    }

    return Array.from(candidates.values())
  }
}
