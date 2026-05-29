import { NextApiRequest, NextApiResponse, PageConfig } from 'next'
import { v4 as uuidv4 } from 'uuid'
import Busboy from 'busboy'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { z } from 'zod'
import { UserNotFoundError } from 'server/domain/error'
import { uploadClubImageStream } from 'server/infra/client/s3'
import { ENV } from '../../../../../../../../../server/ENV'
import { ClubRecruitmentParamsSchema } from 'src/lib/schemas/club-recruitments'
import { ClubAccessService } from 'server/service/club-access.service'

export const maxDuration = 300

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userService = Provider.getService(UserService)
    const clubAccessService = Provider.getService(ClubAccessService)

    if (req.method === 'POST') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const { uuid: clubUuid } = ClubRecruitmentParamsSchema.parse(req.query)
      await clubAccessService.assertManagedClub(clubUuid, user.serviceUserId)

      const url = await new Promise<string>((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers })

        busboy.on('file', (fieldname, file, { filename, mimeType }) => {
          const ext = filename.split('.').pop()
          const newFilename = `${uuidv4()}.${ext}`
          const imageUri = ENV.R2.GET_CLUB_IMAGE_PATH(newFilename)
          const fileKey = `club/${newFilename}`

          uploadClubImageStream(fileKey, file, mimeType)
            .then(() => resolve(imageUri))
            .catch(reject)
        })

        req.pipe(busboy)
      })

      return res.status(200).json({ url })
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('recruitment image upload error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
