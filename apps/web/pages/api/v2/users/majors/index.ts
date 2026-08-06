import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { CollegeMajor } from 'server/domain/model/CollegeMajor'

type ResponseData = {
  majors: CollegeMajor[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const userService = Provider.getService(UserService)

    const isTrueQueryValue = (value: string | string[] | undefined) => {
      if (Array.isArray(value)) {
        return value[0] === 'true'
      }
      return value === 'true'
    }

    if (req.method == 'GET') {
      const includeNullMajor = isTrueQueryValue(req.query.includeNullMajor)
      const collegeMajors = await userService.getCollegeMajors({ includeNullMajor })
      return res.status(200).json({
        majors: collegeMajors,
        totalSize: collegeMajors.length,
      })
    }
  } catch (err) {
    console.error('listCollegeMajors error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
