import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type AppleAppSiteAssociation = {
  applinks: { details: Array<{ appID: string; paths: string[] }> }
}

describe('apple universal links', () => {
  it('opens manager transfer links in every iOS app variant', () => {
    const association = JSON.parse(
      readFileSync(join(process.cwd(), 'public/.well-known/apple-app-site-association'), 'utf8'),
    ) as AppleAppSiteAssociation

    expect(association.applinks.details).not.toHaveLength(0)
    for (const app of association.applinks.details) {
      expect(app.paths).toContain('/manager-transfer/*')
    }
  })
})
