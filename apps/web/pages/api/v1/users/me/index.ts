import { NextApiRequest, NextApiResponse } from 'next'
import { User } from 'server/domain/model/User'
import { Provider } from 'server/provider'
import { UserServiceV1 } from 'server/service/v1/user.service'
import { UserNotFoundError } from '../../../../../server/domain/error'
import { z, ZodIssue } from 'zod'
import { bearerToken } from '../../../../../server/util/token'

const UpdateProfile = z.object({
  nickname: z.string().max(32).optional(),
  name: z.string().max(32).optional(),
  email: z.string().max(80).optional(),
  gender: z.enum(['F', 'M']).optional(),
  birthDate: z.string().max(10).nullable().optional(),
  birthYear: z.string().min(4).max(4).optional(),
  college: z.string().max(40).optional(),
  major: z.string().max(40).optional(),
  collegeMajorId: z.number().nullable().optional(),
  admissionClass: z.number().nullable().optional(),
  grade: z.number().nullable().optional(),
})

export type UpdateProfileDto = z.infer<typeof UpdateProfile>

type ResponseData = {
  profile: User
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserServiceV1)
    if (req.method === 'GET') {
      const user = await userService.getUserByAccountId(req.headers.user as string)

      // mark login timestamp and auth token
      userService
        .markLogin(
          user.id,
          bearerToken({
            get: (name: string) => req.headers[name],
          }),
        )
        .catch(console.error)
      return res.status(200).json({
        profile: user,
      })
    }
    if (req.method === 'PUT') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const updateProfileDto = UpdateProfile.parse(req.body)
      await userService.updateProfile(user, updateProfileDto)
      return res.status(204).end()
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('myProfile error: ', err)
    return res.status(500).send('internal server error')
  }
}
