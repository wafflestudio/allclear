import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { UserServiceV1 } from 'server/service/v1/user.service'
import { V1CollegeMajor } from 'server/service/v1/user.service'

type ResponseData = {
  majors: V1CollegeMajor[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const userService = Provider.getService(UserServiceV1)

    if (req.method == 'GET') {
      const collegeMajors = await userService.getCollegeMajors()
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
