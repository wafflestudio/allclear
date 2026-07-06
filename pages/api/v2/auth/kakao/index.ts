import { NextApiRequest, NextApiResponse } from 'next'
import { ENV } from 'server/ENV'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'GET') {
    const state = Array.isArray(req.query.state) ? req.query.state[0] : req.query.state
    const params = new URLSearchParams({
      client_id: ENV.KAKAO.CLIENT_ID,
      redirect_uri: ENV.KAKAO.REDIRECT_URI,
      response_type: 'code',
    })

    if (state) params.set('state', state)

    return res.redirect(302, `https://kauth.kakao.com/oauth/authorize?${params.toString()}`)
  }
  return res.status(405).send('method not allowed')
}
