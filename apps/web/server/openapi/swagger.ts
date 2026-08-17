import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

export const registry = new OpenAPIRegistry()

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

registry.registerComponent('securitySchemes', 'guestIdAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'x-guest-id',
})

registry.registerComponent('securitySchemes', 'internalApiKeyAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'x-internal-api-key',
})

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Allclear API',
      version: '1.0.0',
      description: 'Zod 스키마를 재사용해 생성한 Allclear API 문서입니다.',
    },
    servers: [
      {
        url: '/',
        description: 'Current deployment',
      },
    ],
  })
}
