import { describe, expect, it } from 'vitest'
import { config } from './middleware'

describe('authentication middleware routes', () => {
  it('authenticates club activity image uploads', () => {
    expect(config.matcher).toContain('/api/v2/managers/me/clubs/:uuid?/activity-images')
  })
})
