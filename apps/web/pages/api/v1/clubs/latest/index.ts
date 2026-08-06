import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ClubServiceV1 } from 'server/service/v1/club.service'
import { V1Club } from 'server/service/v1/club.service'

type ResponseData = {
  clubs: V1Club[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const clubService = Provider.getService(ClubServiceV1)

    if (req.method == 'GET') {
      const clubs = await clubService.findLatestUploaded()
      return res.status(200).json({
        clubs: clubs,
        totalSize: clubs.length,
      })
    }
  } catch (err) {
    console.error('listLatestClubs error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
