import type { NextApiRequest, NextApiResponse } from 'next'
import 'server/http/openapi/register-paths'
import { generateOpenApiDocument } from 'server/http/openapi/swagger'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(generateOpenApiDocument())
}
