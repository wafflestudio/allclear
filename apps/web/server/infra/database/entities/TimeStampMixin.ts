import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm'
import { Exclude } from 'class-transformer'

export abstract class CreatedTimeStampMixin {
  @CreateDateColumn({
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    name: 'created_at',
  })
  createdAt: string
}

export abstract class BaseTimeStampMixin extends CreatedTimeStampMixin {
  @UpdateDateColumn({
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    name: 'updated_at',
  })
  updatedAt: string
}

export abstract class TimeStampMixin extends BaseTimeStampMixin {
  @DeleteDateColumn({
    type: 'timestamp',
    precision: 6,
    nullable: true,
    select: false,
    name: 'deleted_at',
  })
  @Exclude({ toPlainOnly: true })
  deletedAt?: string | null
}

export abstract class ClubTimeStampMixin {
  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    name: 'created_at',
  })
  createdAt: string

  @UpdateDateColumn({
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    name: 'updated_at',
  })
  updatedAt: string

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'deleted_at',
  })
  deletedAt: string | null
}
