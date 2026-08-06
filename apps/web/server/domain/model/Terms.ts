import { TermsEntity } from '../../infra/database/entities'

export type Terms = {
  uuid: string
  termsKey: string
  title: string
  contentUrl: string
  version: string
  isMandatory: boolean
}

export const toTermsDomain = (entity: TermsEntity): Terms => ({
  uuid: entity.uuid,
  termsKey: entity.termsKey,
  title: entity.title,
  contentUrl: entity.contentUrl,
  version: entity.version,
  isMandatory: entity.isMandatory,
})
