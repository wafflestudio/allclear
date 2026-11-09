import { createHash } from 'node:crypto'
import { Parser } from 'htmlparser2'

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export type ClubEmbeddingSource = {
  uuid: string
  document: Json
  embedding_model: string | null
  embedding_source_hash: string | null
  embedding_updated_at: string | null
  has_embedding: boolean
}

// 공개된 업무 정보만 선택합니다. 식별자·관리 기록·임베딩 자체는 입력에 넣지 않습니다.
export const EMBEDDING_SOURCE_QUERY = `
  SELECT c.uuid, c.embedding_model, c.embedding_source_hash, c.embedding_updated_at,
         c.embedding IS NOT NULL AS has_embedding,
         jsonb_build_object(
           'club', (SELECT to_jsonb(info) FROM (
             SELECT c.name, c.short_description, c.description, c.introduction,
                    c.article, c.article_uploaded_at, c.type, c.category, c.affiliation_type,
                    c.has_dongbang, c.dongbang_location, c.min_activity_period,
                    c.active_member_count, c.founded_at, c.recruit_type,
                    c.is_official_verified, c.verified_at, c.sns, c.sns_urls,
                    c.image_uri, c.activity_image_urls
           ) info),
           'affiliation', jsonb_build_object('college', cm.college, 'major', cm.major),
           'latest_recruitment', (SELECT to_jsonb(info) FROM (
             SELECT r.title, r.deadline, r.year_month, r.is_mandatory, r.has_regular_meeting,
                    r.application_url, r.application_process, r.activity_location_type,
                    r.activity_location_text, r.has_eligibility, r.eligibility_text,
                    r.has_capacity_limit, r.capacity_limit_text,
                    r.has_membership_fee, r.membership_fee_text,
                    r.full_recruitment_text, r.image_urls,
                    (SELECT jsonb_agg(jsonb_build_object(
                       'day_of_week', m.day_of_week,
                       'start_time', m.start_time, 'end_time', m.end_time
                     )) FROM public.regular_meeting m
                     WHERE m.club_recruitment_id = r.id) AS regular_meetings
             FROM public.club_recruitment r
             WHERE r.club_id = c.uuid AND r.deleted_at IS NULL
             ORDER BY r.year_month DESC, r.created_at DESC, r.id DESC LIMIT 1
           ) info),
           'reviews', jsonb_build_object(
             'count', (SELECT COUNT(*) FROM public.user_club_review WHERE club_id = c.uuid),
             'keywords', (SELECT jsonb_agg(to_jsonb(info)) FROM (
               SELECT category.title AS category, keyword.title, COUNT(*) AS votes
               FROM public.user_club_review review
               JOIN public.club_review_keyword keyword
                 ON keyword.id = ANY(review.review_keyword_ids) AND keyword.deleted_at IS NULL
               JOIN public.club_review_keyword_category category
                 ON category.id = keyword.category_id AND category.deleted_at IS NULL
               WHERE review.club_id = c.uuid
               GROUP BY category.title, keyword.title
             ) info)
           )
         ) AS document
  FROM public.club c
  LEFT JOIN public.college_major cm ON cm.id = c.college_major_id AND cm.deleted_at IS NULL
  WHERE c.status = 'APPROVED' AND c.deleted_at IS NULL`

function plainText(html: string): string {
  let text = ''
  let hidden = 0
  const parser = new Parser({
    onopentag(name) {
      if (name === 'script' || name === 'style') hidden++
      if (/^(p|div|br|li|h[1-6]|tr|td|section|blockquote)$/.test(name)) text += ' '
    },
    ontext(value) {
      if (!hidden) text += value
    },
    onclosetag(name) {
      if (name === 'script' || name === 'style') hidden--
      if (/^(p|div|li|h[1-6]|tr|td|section|blockquote)$/.test(name)) text += ' '
    },
  })
  parser.end(html)
  return text.normalize('NFC').replace(/\s+/g, ' ').trim()
}

function normalize(value: Json): Json | undefined {
  if (value === null) return undefined
  if (typeof value === 'string') return plainText(value) || undefined
  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    const items = value.map(normalize).filter((item) => item !== undefined)
    // URL·모임·키워드 배열은 순서와 중복에 관계없이 같은 검색 문서로 취급합니다.
    const unique = [...new Set(items.map((item) => JSON.stringify(item)))].sort()
    return unique.length ? unique.map((item) => JSON.parse(item) as Json) : undefined
  }

  const entries = Object.keys(value)
    .sort()
    .flatMap((key) => {
      const item = normalize(value[key])
      return item === undefined ? [] : [[key, item] as const]
    })
  return entries.length ? Object.fromEntries(entries) : undefined
}

export const embeddingText = (club: ClubEmbeddingSource): string =>
  JSON.stringify(normalize(club.document) ?? {})

export const sourceHash = (club: ClubEmbeddingSource): string =>
  createHash('sha256').update(embeddingText(club)).digest('hex')
