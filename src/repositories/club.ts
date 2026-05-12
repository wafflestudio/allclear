import { Club } from 'src/entities/club'
import {
  CLUB_AFFILIATION_TYPES,
  CLUB_CATEGORIES,
  CLUB_COLLEGES,
  CLUB_RECRUIT_TYPES,
} from 'src/fixtures/club-options'
import { z } from 'zod'

export { CLUB_AFFILIATION_TYPES, CLUB_CATEGORIES, CLUB_COLLEGES, CLUB_RECRUIT_TYPES }

export type GetManageClubRequest = {
  uuid: Club['uuid']
  authorization: string
}

export const UpdateManageClubRequestValidator = z.object({
  name: z.string().nonempty().max(30),
  fullName: z.string().nonempty().max(50),
  type: z.enum(['교내', '연합']),
  recruitType: z
    .enum(['선택 안함', ...CLUB_RECRUIT_TYPES])
    .nullable()
    .optional(),
  category: z.enum(CLUB_CATEGORIES),
  tags: z
    .array(
      z
        .string()
        .nonempty()
        .max(10)
        .regex(/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9_\-.]+$/),
    )
    .max(5),
  college: z.enum(CLUB_COLLEGES),
  affiliationType: z.enum(CLUB_AFFILIATION_TYPES),
  collegeMajorId: z.number().int().nullable().optional(),
  introduction: z.string().max(1000).nullable().optional(),
  detail: z.string().max(5000).nullable().optional(),
  file: z.any(),
})

export type UpdateManageClubRequest = z.infer<typeof UpdateManageClubRequestValidator> & {
  uuid: Club['uuid']
  authorization: string
}

export type UpdateManageClubImageRequest = {
  image: File
  uuid: Club['uuid']
  authorization: string
}

export type ClubRepository = {
  updateManageClub: (req: UpdateManageClubRequest, image?: File) => Promise<void>
  updateManageClubImage: (req: UpdateManageClubImageRequest) => Promise<void>
  getManageClub: (req: GetManageClubRequest) => Promise<Club>
}

export const getClubRepository = (): ClubRepository => ({
  updateManageClub: async (req) => {
    await fetch(`/api/v2/managers/me/clubs/${req.uuid}`, {
      method: 'PUT',
      headers: {
        'x-authorization': req.authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    }).then(async (res) => {
      if (!res.ok) {
        alert('일부 정보가 잘못되어 동아리 정보를 수정하는데 실패했습니다.')
        const error = await res.json()
        alert(JSON.stringify(error, null, 2))
        throw new Error(JSON.stringify(error))
      }
    })
  },

  updateManageClubImage: async (req) => {
    const formData = new FormData()
    formData.append('file', req.image)

    await fetch(`/api/v2/managers/me/clubs/${req.uuid}/images`, {
      headers: {
        'x-authorization': req.authorization,
      },
      method: 'POST',
      body: formData,
    })
  },

  getManageClub: async (req) => {
    const response = await fetch(`/api/v2/managers/me/clubs/${req.uuid}`, {
      headers: {
        'x-authorization': req.authorization,
      },
    }).then((res) => {
      if (!res.ok) throw new Error('Error fetching clubs')

      return res.json() as Promise<Club>
    })
    return response
  },
})
