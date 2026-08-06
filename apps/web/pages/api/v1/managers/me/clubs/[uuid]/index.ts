import { NextApiHandler } from 'next'
import { z } from 'zod'
import { Provider } from 'server/provider'
import { ClubServiceV1 } from 'server/service/v1/club.service'
import { UserServiceV1 } from 'server/service/v1/user.service'
import { UserNotFoundError } from 'server/domain/error'

const RequestBody = z.object({
  name: z.string().nonempty().max(30),
  fullName: z.string().nonempty().max(50),
  type: z.enum(['교내', '연합']),
  recruitType: z.enum(['정기', '상시', '매 학기', '매 년']).optional(),
  category: z.enum(['취미', '공연', '홍보', '진로', '종교', '문화', '학술', '운동', '봉사']),
  tags: z
    .array(
      z
        .string()
        .nonempty()
        .max(10)
        .regex(/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9_\-.]+$/),
    )
    .max(5),
  college: z.enum([
    '단과대무관',
    '중앙동아리',
    '연합동아리',
    '사범대학',
    '자연과학대학',
    '농업생명과학대학',
    '경영대학',
    '간호대학',
    '공과대학',
    '인문대학',
    '생활과학대학',
    '음악대학',
    '사회과학대학',
    '수의과대학',
    '미술대학',
    '법대',
  ]),
  introduction: z.string().max(1000).optional(),
  detail: z.string().max(5000).nullable().optional(),
})

const QueryValidator = z.object({
  uuid: z.string().uuid(),
})

const api: NextApiHandler = async (req, res) => {
  try {
    const clubService = Provider.getService(ClubServiceV1)
    const userService = Provider.getService(UserServiceV1)

    const user = await userService.getUserByAccountId(req.headers.user as string)
    const { uuid: clubUuid } = QueryValidator.parse(req.query)
    if (req.method == 'GET') {
      const club = await clubService.getManagedClubByUuid(clubUuid, user.serviceUserId)
      return res.status(200).json(club)
    }

    if (req.method === 'PUT') {
      const club = await clubService.getManagedClubByUuid(clubUuid, user.serviceUserId)

      const body = RequestBody.parse(req.body)

      await clubService.updateClub(club.uuid, {
        name: body.name,
        fullName: body.fullName,
        description: body.fullName,
        type: body.type,
        recruitType: body.recruitType,
        category: body.category,
        tags: body.tags,
        college: body.college,
        introduction: body.introduction,
        ...(body.detail && body.detail !== club.article
          ? { article: body.detail, articleUploadedAt: new Date().toISOString() }
          : {}),
      })
      return res.status(200).end()
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('editClub error: ', err)
    return res.status(500).send('Internal Server Error')
  }
  // 다른 HTTP 메서드에 대한 처리 (예: POST, PUT, DELETE 등)
  return res.status(405).end() // Method Not Allowed
}

export default api
