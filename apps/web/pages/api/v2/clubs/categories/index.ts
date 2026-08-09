import type { NextApiRequest, NextApiResponse } from 'next'
import type { ClubCategory } from 'server/domain/model/ClubCategory'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'

type ResponseData = {
  categories: ClubCategory[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const clubService = Provider.getService(ClubService)

    if (req.method == 'GET') {
      const categories = await clubService.getCategories()
      return res.status(200).json({
        categories: categories,
        totalSize: categories.length,
      })
    }
  } catch (err) {
    console.error('listClubCategories error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
