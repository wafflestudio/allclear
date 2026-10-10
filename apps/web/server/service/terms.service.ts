import { BadRequestError } from '../domain/error'
import { type Terms, toTermsDomain } from '../domain/model/Terms'
import { getPrismaClient } from '../infra/database/prisma'
import { Service } from '../provider'

@Service
export class TermsService {
  async listUnagreedTerms(userId: string): Promise<Terms[]> {
    const terms = await getPrismaClient().terms.findMany({
      where: {
        active: true,
        terms_agreement: { none: { user_id: userId } },
      },
      orderBy: { created_at: 'desc' },
    })
    return terms.map(toTermsDomain)
  }

  async agreeToTerms(userId: string, termUuids: string[]): Promise<void> {
    const uniqueTermUuids = [...new Set(termUuids)]

    const prisma = getPrismaClient()
    const terms = await prisma.terms.findMany({
      where: { uuid: { in: uniqueTermUuids }, active: true },
    })

    if (terms.length !== uniqueTermUuids.length) {
      throw new BadRequestError('invalid term uuids')
    }

    if (terms.length === 0) {
      return
    }

    await prisma.terms_agreement.createMany({
      data: terms.map((term) => ({ user_id: userId, terms_id: term.id })),
      skipDuplicates: true,
    })
  }
}
