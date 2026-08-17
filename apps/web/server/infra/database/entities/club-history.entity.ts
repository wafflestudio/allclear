import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('club_history')
@Index('idx_club_history_club_id', ['clubId'])
@Index('idx_club_history_created_at', ['createdAt'])
export class ClubHistoryEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'club_id' })
  clubId: string

  @Column({ type: 'uuid', name: 'service_user_id' })
  serviceUserId: string

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb", name: 'before_data' })
  beforeData: Record<string, unknown>

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb", name: 'after_data' })
  afterData: Record<string, unknown>

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb", name: 'changed_fields' })
  changedFields: string[]

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    name: 'created_at',
  })
  createdAt: string
}
