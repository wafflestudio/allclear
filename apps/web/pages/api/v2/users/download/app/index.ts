import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'

const logApiCall = async (req) => {
  const userService = Provider.getService(UserService)

  const device = req.query['userAgent']
  let ip = req.ip ?? req.headers['x-real-ip'] ?? ''
  const forwardedFor = req.headers['x-forwarded-for']
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(',').at(0) ?? ''
  }
  return userService.logVisitAppDownloadPage(device, ip, JSON.stringify(req.query))
}

const api = async (req, res) => {
  if (req.method === 'POST') {
    logApiCall(req).catch((e) => console.error(e))
    return res.status(200).json()
  }

  return res.status(405).end() // Method Not Allowed
}

export default api
