import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm'
import { InjectRepository, Service } from '../provider'
import { ClubEntity } from '../infra/database/entities'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import {
  ClubStatus,
  PUBLIC_CLUB_STATUS,
  REJECTED_CLUB_STATUS,
} from 'src/common/constants/club-status'
import { NotFoundError } from 'server/domain/error'
import type { AdminClubStatusUpdate } from 'src/lib/schemas/admin'

export type AdminClubItem = {
  uuid: string
  name: string
  status: ClubStatus
  category: string
  affiliation: string
  short_description: string
  created_at: string
  manager: {
    name: string
    phone: string
    student_id: string
  }
}

export type AdminClubDetail = {
  club_data: {
    uuid: string
    status: ClubStatus
    name: string
    type: string
    category: string
    affiliation: string
    college_major_id: number | null
    short_description: string
    image_uri: string
    recruit_type: string | null
    min_activity_period: number
    has_dongbang: boolean
    dongbang_location: string
    sns: string
    introduction: string | null
    created_at: string
  }
  manager_data: {
    name: string
    phone: string
    student_id: string
    service_user_id: string
  }
}

@Service
export class AdminClubService {
  @InjectRepository(ClubEntity)
  private readonly clubRepository: Repository<ClubEntity>

  @InjectRepository(ClubManagerEntity)
  private readonly clubManagerRepository: Repository<ClubManagerEntity>

  async getAdminClubs(status?: ClubStatus): Promise<AdminClubItem[]> {
    const where: FindOptionsWhere<ClubEntity> = {
      deletedAt: IsNull(),
    }
    if (status) {
      where.status = status
    }

    const clubs = await this.clubRepository.find({
      where,
      order: { createdAt: 'ASC' },
    })

    if (clubs.length === 0) return []

    const managers = await this.clubManagerRepository.findBy({
      clubId: In(clubs.map((c) => c.uuid)),
    })
    const managerMap = new Map(managers.map((m) => [m.clubId, m]))

    return clubs.map((club) => {
      const manager = managerMap.get(club.uuid)
      return {
        uuid: club.uuid,
        name: club.name,
        status: club.status,
        category: club.category,
        affiliation:
          club.affiliationType === '소속동아리'
            ? club.collegeMajor?.major ?? club.collegeMajor?.college ?? ''
            : club.affiliationType,
        short_description: club.shortDescription,
        created_at: club.createdAt,
        manager: {
          name: manager?.name ?? '',
          phone: manager?.phone ?? '',
          student_id: manager?.studentId ?? '',
        },
      }
    })
  }

  async getAdminClubDetail(clubUuid: string): Promise<AdminClubDetail> {
    const club = await this.clubRepository.findOneBy({
      uuid: clubUuid,
      deletedAt: IsNull(),
    })

    if (!club) {
      throw new NotFoundError('club not found')
    }

    const manager = await this.clubManagerRepository.findOneBy({
      clubId: clubUuid,
    })

    return {
      club_data: {
        uuid: club.uuid,
        status: club.status,
        name: club.name,
        type: club.type,
        category: club.category,
        affiliation:
          club.affiliationType === '소속동아리'
            ? club.collegeMajor?.major ?? club.collegeMajor?.college ?? ''
            : club.affiliationType,
        college_major_id: club.collegeMajorId,
        short_description: club.shortDescription,
        image_uri: club.imageUri,
        recruit_type: club.recruitType,
        min_activity_period: club.minActivityPeriod,
        has_dongbang: club.hasDongbang,
        dongbang_location: club.dongbangLocation,
        sns: club.sns,
        introduction: club.introduction,
        created_at: club.createdAt,
      },
      manager_data: {
        name: manager?.name ?? '',
        phone: manager?.phone ?? '',
        student_id: manager?.studentId ?? '',
        service_user_id: manager?.serviceUserId ?? '',
      },
    }
  }

  async updateAdminClubStatus(
    clubUuid: string,
    decision: AdminClubStatusUpdate,
  ): Promise<{ club_uuid: string; status: AdminClubStatusUpdate['status']; processed_at: string }> {
    const club = await this.clubRepository.findOneBy({
      uuid: clubUuid,
      deletedAt: IsNull(),
    })

    if (!club) {
      throw new NotFoundError('club not found')
    }

    const processedAt = new Date().toISOString()
    const isApproved = decision.status === PUBLIC_CLUB_STATUS
    const isRejected = decision.status === REJECTED_CLUB_STATUS

    await this.clubRepository.update(
      {
        uuid: clubUuid,
        deletedAt: IsNull(),
      },
      {
        status: decision.status,
        approvedAt: isApproved ? processedAt : null,
        rejectReason: isRejected ? decision.reject_reason?.trim() ?? '' : '',
        isOfficialVerified: isApproved ? decision.is_official_verified : false,
        verifiedAt: isApproved && decision.is_official_verified ? processedAt : null,
      },
    )

    return {
      club_uuid: clubUuid,
      status: decision.status,
      processed_at: processedAt,
    }
  }
}
