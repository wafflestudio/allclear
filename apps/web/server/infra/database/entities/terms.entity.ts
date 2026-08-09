import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { CreatedTimeStampMixin } from './TimeStampMixin'

@Entity('terms')
@Index('ux_terms_uuid', ['uuid'], { unique: true })
@Index('ux_terms_key_version', ['termsKey', 'version'], { unique: true })
export class TermsEntity extends CreatedTimeStampMixin {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number

  @Column({ type: 'uuid', name: 'uuid' })
  uuid: string

  @Column({ type: 'varchar', length: 255, name: 'title' })
  title: string

  @Column({ type: 'varchar', length: 255, name: 'content_url' })
  contentUrl: string

  @Column({ type: 'varchar', length: 32, name: 'version' })
  version: string

  @Column({ type: 'boolean', default: true, name: 'is_mandatory' })
  isMandatory: boolean

  @Column({ type: 'boolean', default: false, name: 'active' })
  active: boolean

  @Column({ type: 'varchar', length: 64, name: 'terms_key' })
  termsKey: string
}
