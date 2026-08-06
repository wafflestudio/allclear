import { NextApiRequest, NextApiResponse } from 'next'
import { ENV } from 'server/ENV'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'GET') {
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${ENV.KAKAO.CLIENT_ID}&redirect_uri=${ENV.KAKAO.REDIRECT_URI}&response_type=code`
    return res.redirect(301, KAKAO_AUTH_URL)
  }
  return res.status(405).send('method not allowed')
}
