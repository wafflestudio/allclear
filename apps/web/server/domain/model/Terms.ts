import type { termsModel } from '../../infra/database/generated/prisma/models/terms'

export type Terms = {
  uuid: string
  termsKey: string
  title: string
  contentUrl: string
  version: string
  isMandatory: boolean
}

export const toTermsDomain = (entity: termsModel): Terms => ({
  uuid: entity.uuid,
  termsKey: entity.terms_key,
  title: entity.title,
  contentUrl: entity.content_url,
  version: entity.version,
  isMandatory: entity.is_mandatory,
})
