import Busboy from 'busboy'
import { NextApiRequest, NextApiResponse, PageConfig } from 'next'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UserNotFoundError,
} from 'server/domain/error'
import { ENV } from 'server/ENV'
import { uploadClubImageStream } from 'server/infra/client/s3'
import { Provider } from 'server/provider'
import { ClubAccessService } from 'server/service/club-access.service'
import { UserService } from 'server/service/user.service'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export const maxDuration = 300

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
}

function uploadActivityImage(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_IMAGE_SIZE,
      },
    })
    let hasFile = false
    let settled = false

    const resolveOnce = (url: string) => {
      if (!settled) {
        settled = true
        resolve(url)
      }
    }
    const rejectOnce = (error: Error) => {
      if (!settled) {
        settled = true
        reject(error)
      }
    }

    busboy.on('file', (_fieldname, file, { mimeType }) => {
      hasFile = true
      const extension = IMAGE_EXTENSION_BY_MIME_TYPE[mimeType]
      if (!extension) {
        file.resume()
        rejectOnce(new BadRequestError('지원하지 않는 이미지 형식입니다.'))
        return
      }

      const newFilename = `${uuidv4()}.${extension}`
      const imageUri = ENV.R2.GET_CLUB_IMAGE_PATH(newFilename)
      const fileKey = `club/${newFilename}`

      file.on('limit', () => {
        file.destroy(new BadRequestError('이미지 크기는 10MB 이하여야 합니다.'))
      })

      uploadClubImageStream(fileKey, file, mimeType)
        .then(() => resolveOnce(imageUri))
        .catch((error: Error) => rejectOnce(error))
    })

    busboy.on('finish', () => {
      if (!hasFile) {
        rejectOnce(new BadRequestError('이미지 파일이 필요합니다.'))
      }
    })
    busboy.on('error', (error) =>
      rejectOnce(error instanceof Error ? error : new Error('이미지 업로드에 실패했습니다.')),
    )
    req.pipe(busboy)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  try {
    const userService = Provider.getService(UserService)
    const clubAccessService = Provider.getService(ClubAccessService)
    const user = await userService.getUserByAccountId(req.headers.user as string)
    const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)

    await clubAccessService.assertManagedClub(clubUuid, user.serviceUserId)
    const url = await uploadActivityImage(req)
    return res.status(200).json({ url })
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(401).send('Unauthorized')
    }
    if (error instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
    }
    if (error instanceof NotFoundError) {
      return res.status(404).send('Not Found')
    }
    if (error instanceof BadRequestError) {
      return res.status(400).send(error.message)
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors)
    }
    console.error('activity image upload error: ', error)
    return res.status(500).send('Internal Server Error')
  }
}
