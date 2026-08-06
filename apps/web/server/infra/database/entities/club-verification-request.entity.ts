import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('club_verification_request')
export class ClubVerificationRequestEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'club_id' })
  clubId: string

  @Column({ type: 'varchar', default: 'PENDING', name: 'status' })
  status: string

  @Column({ type: 'varchar', nullable: true, name: 'reject_reason' })
  rejectReason: string | null

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    name: 'created_at',
  })
  createdAt: string
}
