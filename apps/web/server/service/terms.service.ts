import type { Repository } from 'typeorm'
import { BadRequestError } from '../domain/error'
import { type Terms, toTermsDomain } from '../domain/model/Terms'
import { TermsAgreementEntity, TermsEntity } from '../infra/database/entities'
import { InjectRepository, Service } from '../provider'

@Service
export class TermsService {
  @InjectRepository(TermsEntity)
  private readonly termsRepository: Repository<TermsEntity>
  @InjectRepository(TermsAgreementEntity)
  private readonly termsAgreementRepository: Repository<TermsAgreementEntity>

  async listUnagreedTerms(userId: string): Promise<Terms[]> {
    const agreements = await this.termsAgreementRepository.findBy({
      userId,
    })
    const agreedTermsIds = agreements.map((agreement) => agreement.termsId)

    const query = this.termsRepository
      .createQueryBuilder('terms')
      .where('terms.active = true')
      .orderBy('terms.created_at', 'DESC')

    if (agreedTermsIds.length > 0) {
      query.andWhere('terms.id NOT IN (:...agreedTermsIds)', {
        agreedTermsIds,
      })
    }

    const entities = await query.getMany()
    return entities.map(toTermsDomain)
  }

  async agreeToTerms(userId: string, termUuids: string[]): Promise<void> {
    const uniqueTermUuids = [...new Set(termUuids)]

    const terms = await this.termsRepository.find({
      where: uniqueTermUuids.map((uuid) => ({
        uuid,
        active: true,
      })),
    })

    if (terms.length !== uniqueTermUuids.length) {
      throw new BadRequestError('invalid term uuids')
    }

    if (terms.length === 0) {
      return
    }

    await this.termsAgreementRepository
      .createQueryBuilder()
      .insert()
      .into(TermsAgreementEntity)
      .values(
        terms.map((terms) => ({
          userId,
          termsId: terms.id,
          agreedAt: new Date().toISOString(),
        })),
      )
      .orIgnore()
      .execute()
  }
}
