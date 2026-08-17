import type { NextApiRequest, NextApiResponse } from 'next'
import 'server/openapi/register-paths'
import { generateOpenApiDocument } from 'server/openapi/swagger'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(generateOpenApiDocument())
}
