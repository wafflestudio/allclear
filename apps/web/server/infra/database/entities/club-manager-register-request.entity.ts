import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('club_manager_request')
export class ClubManagerRegisterRequestEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'service_user_id' })
  serviceUserId: string

  @Column('uuid', { name: 'club_id' })
  clubId: string

  @Column({ type: 'varchar', name: 'name' })
  name: string

  @Column({ type: 'varchar', name: 'phone' })
  phone: string

  @Column({ type: 'varchar', name: 'student_id' })
  studentId: string

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
