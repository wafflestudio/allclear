import type { NextApiRequest, NextApiResponse } from 'next'
import 'src/lib/openapi/register-paths'
import { generateOpenApiDocument } from 'src/lib/openapi/swagger'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(generateOpenApiDocument())
}
