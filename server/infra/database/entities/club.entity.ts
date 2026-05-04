import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CollegeMajorEntity } from './college-major.entity'
import type { ClubStatus } from 'src/common/constants/club-status'
import { ClubTimeStampMixin } from './TimeStampMixin'

@Entity('club')
@Index('ux_club_uuid', ['uuid'])
@Index('ux_club_authkey', ['authkey'])
@Index('ix_club_category', ['category'])
@Index('ix_club_ispopular', ['isPopular'])
export class ClubEntity extends ClubTimeStampMixin {
  @PrimaryGeneratedColumn('uuid', { name: 'uuid' })
  uuid: string

  @Column({ type: 'varchar', name: 'name' })
  name: string

  @Column({ type: 'varchar', default: '', name: 'full_name' })
  fullName: string

  @Column({ type: 'varchar', default: '', name: 'description' })
  description: string

  @Column({ type: 'varchar', default: '', name: 'short_description' })
  shortDescription: string

  @Column({ type: 'varchar', default: '', name: 'type' })
  type: string

  @Column({ type: 'varchar', default: '', name: 'category' })
  category: string

  @Column({ type: 'varchar', default: '', nullable: true, name: 'college' })
  college: string | null

  @Column({ type: 'varchar', default: '', name: 'affiliation_type' })
  affiliationType: string

  @Column({ type: 'int', nullable: true, name: 'college_major_id' })
  collegeMajorId: number | null

  @ManyToOne(() => CollegeMajorEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'college_major_id' })
  collegeMajor: CollegeMajorEntity | null

  @Column({ type: 'varchar', default: '', length: 300, name: 'image_uri' })
  imageUri: string

  @Column({ type: 'varchar', default: '', nullable: true, name: 'thumbnail_uri' })
  thumbnailUri: string | null

  @Column({ type: 'character varying', array: true, default: '', nullable: true, name: 'tags' })
  tags: string[]

  @Column({ type: 'varchar', default: '', name: 'article', nullable: true })
  article: string | null

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'article_uploaded_at' })
  articleUploadedAt: string | null

  @Column({ type: 'boolean', default: false, name: 'is_popular' })
  isPopular: boolean

  @Column({ type: 'boolean', default: false, name: 'has_dongbang' })
  hasDongbang: boolean

  @Column({ type: 'varchar', default: '', name: 'dongbang_location' })
  dongbangLocation: string

  @Column({ type: 'varchar', default: '', nullable: true, name: 'activity_cycle' })
  activityCycle: string | null

  @Column({ type: 'int', default: 0, name: 'min_activity_period' })
  minActivityPeriod: number

  @Column({ type: 'int', default: 0, name: 'active_member_count' })
  activeMemberCount: number

  @Column({ type: 'varchar', default: '', nullable: true, name: 'membership_fee' })
  membershipFee: string | null

  @Column({ type: 'varchar', default: '', nullable: true, name: 'recruit_type' })
  recruitType: string | null

  @Column({ type: 'boolean', default: false, name: 'is_official_verified' })
  isOfficialVerified: boolean

  @Column({ type: 'timestamp without time zone', nullable: true, name: 'verified_at' })
  verifiedAt: string | null

  @Column({ type: 'varchar', default: '', name: 'sns' })
  sns: string

  @Column({ type: 'varchar', default: '', nullable: true, name: 'introduction' })
  introduction: string | null

  @Column({ type: 'text', nullable: true, name: 'blur_image' })
  blurImage: string | null

  @Column({ type: 'varchar', nullable: true, name: 'blur_hash' })
  blurHash: string | null

  @Column({ type: 'uuid', select: false, unique: true, name: 'authkey' })
  authkey: string

  @Column({ type: 'timestamp without time zone', nullable: true, name: 'approved_at' })
  approvedAt: string | null

  @Column({ type: 'varchar', default: 'PENDING', name: 'status' })
  status: ClubStatus

  @Column({ type: 'varchar', default: '', nullable: true, name: 'reject_reason' })
  rejectReason: string | null
}
