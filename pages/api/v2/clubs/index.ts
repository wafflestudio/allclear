import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { Club } from 'server/domain/model/Club'

type ResponseData = {
  clubs: Club[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const clubService = Provider.getService(ClubService)

    if (req.method == 'GET') {
      const category = req.query.category as string
      if (!category) {
        return res.status(400).send('category is required')
      }
      const clubs = await clubService.findByCategory(category)
      return res.status(200).json({
        clubs: clubs,
        totalSize: clubs.length,
      })
    }
  } catch (err) {
    console.error('listClubs error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
