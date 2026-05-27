import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { NotFoundError } from 'server/domain/error'
import { AppVersionService } from 'server/service/app-version.service'
import { AppVersionCheckResponse, AppVersionCheckSchema } from 'src/lib/schemas/app-versions'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AppVersionCheckResponse | string | ZodIssue[]>,
) {
  try {
    if (req.method === 'POST') {
      const appVersionService = Provider.getService(AppVersionService)
      const { clientType, appVersion } = AppVersionCheckSchema.parse(req.body)
      const result = await appVersionService.checkVersion(clientType, appVersion)

      return res.status(200).json({
        updateRequired: result.updateRequired,
        clientType: result.clientType,
        minSupportedVersion: result.minSupportedVersion,
        storeUrl: result.storeUrl,
      })
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).send('app version policy not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('checkAppVersion error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
