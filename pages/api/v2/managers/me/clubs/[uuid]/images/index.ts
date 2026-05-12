import { NextApiRequest, NextApiResponse, PageConfig } from 'next'
import { v4 as uuidv4 } from 'uuid'
import Busboy from 'busboy'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { z } from 'zod'
import { UserService } from 'server/service/user.service'
import { UserNotFoundError } from 'server/domain/error'
import { uploadClubImageStream } from 'server/infra/client/s3'
import { ENV } from '../../../../../../../../server/ENV'
import fetch from 'node-fetch'
import sharp from 'sharp'
import { encode } from 'blurhash'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'

export const maxDuration = 300 // 5 minutes (maximum for Vercel Pro)

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
}

async function r(
  req: NextApiRequest,
  clubId: string,
  persist: (clubId: string, imageUri: string, blurHash: string) => Promise<boolean>,
) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers })

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      const ext = filename.split('.').pop()
      const newFilename = `${uuidv4()}.${ext}`
      const imageUri = ENV.R2.GET_CLUB_IMAGE_PATH(newFilename)
      const fileKey = `club/${newFilename}`

      // upload to r2 storage
      uploadClubImageStream(fileKey, file, mimeType).then(async () => {
        try {
          const res = await fetch(imageUri)
          const buffer = await res.arrayBuffer()
          const { data: pixels, info: metadata } = await sharp(buffer)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true })
          const clamped = new Uint8ClampedArray(pixels)
          const blurhash = encode(clamped, metadata.width, metadata.height, 4, 4)

          await persist(clubId, imageUri, blurhash)
          resolve(1)
        } catch (err) {
          reject(err)
        }
      })
    })

    req.pipe(busboy)
  })
}
export default async function imageUploadHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)

    if (req.method == 'POST') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
      const club = await clubService.getManagedClubByUuid(clubUuid, user.serviceUserId)

      const persist = (clubId: string, imageUri: string, blurHash: string) =>
        clubService.updateClub(clubId, { imageUri, blurHash })
      await r(req, club.uuid, persist)

      return res.status(200).end(JSON.stringify({ ok: true }))
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('updateClubImage error: ', err)
    return res.status(500).send('Internal Server Error')
  }
  // 다른 HTTP 메서드에 대한 처리 (예: POST, PUT, DELETE 등)
  return res.status(405).end() // Method Not Allowed
}
