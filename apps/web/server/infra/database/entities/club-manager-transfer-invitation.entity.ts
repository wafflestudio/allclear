import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('club_manager_transfer_invitation')
@Index('uq_club_manager_transfer_token_hash', ['tokenHash'], { unique: true })
@Index('uq_club_manager_transfer_active_club', ['clubId'], {
  unique: true,
  where: '"revoked_at" IS NULL AND "accepted_at" IS NULL',
})
export class ClubManagerTransferInvitationEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'club_id' })
  clubId: string

  @Column({ type: 'uuid', name: 'sender_service_user_id' })
  senderServiceUserId: string

  @Column({ type: 'char', length: 64, name: 'token_hash' })
  tokenHash: string

  @Column({ type: 'timestamp with time zone', name: 'expires_at' })
  expiresAt: string

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'revoked_at' })
  revokedAt: string | null

  @Column({ type: 'uuid', nullable: true, name: 'accepted_by_service_user_id' })
  acceptedByServiceUserId: string | null

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'accepted_at' })
  acceptedAt: string | null

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    name: 'created_at',
  })
  createdAt: string
}
