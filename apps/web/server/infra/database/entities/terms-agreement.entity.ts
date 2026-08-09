import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('terms_agreement')
@Index('ux_terms_agreement_user_terms', ['userId', 'termsId'], { unique: true })
export class TermsAgreementEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'int', name: 'terms_id' })
  termsId: number

  @Column({ type: 'timestamp', name: 'agreed_at' })
  agreedAt: string
}
