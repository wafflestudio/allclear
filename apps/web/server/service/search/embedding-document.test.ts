import { describe, expect, it } from 'vitest'
import { buildEmbeddingDocument } from './embedding-document'

describe('embedding document', () => {
  it('removes markup and empty values while retaining false and zero', () => {
    const { text } = buildEmbeddingDocument({
      club: {
        name: '<p>음악 &amp; 공연</p><script>hidden()</script><style>hidden</style>',
        description: '<div>함께</div><div>연주해요</div>',
        has_dongbang: false,
        min_activity_period: 0,
        introduction: '  ',
        article: null,
      },
      affiliation: { college: null, major: '' },
      latest_recruitment: null,
      reviews: { count: 0, keywords: [] },
    })

    expect(text).toBe(
      '{"club":{"description":"함께 연주해요","has_dongbang":false,"min_activity_period":0,"name":"음악 & 공연"},"reviews":{"count":0}}',
    )
  })

  it('keeps the same text and hash for reordered keys, duplicate items and Unicode forms', () => {
    const first = buildEmbeddingDocument({
      club: { name: '가', sns_urls: ['b', 'a', 'a'] },
      meetings: [{ day: 2, time: '12:00' }, { day: 1 }],
    })
    const second = buildEmbeddingDocument({
      meetings: [{ day: 1 }, { time: '12:00', day: 2 }],
      club: { sns_urls: ['a', 'b'], name: '가'.normalize('NFD') },
    })

    expect(second).toEqual(first)
  })
})
