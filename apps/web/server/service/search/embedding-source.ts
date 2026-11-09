import { Prisma } from 'server/infra/database/generated/prisma/client'
import type { Json } from './embedding-document'

export type ClubEmbeddingSource = {
  uuid: string
  document: Json
  embedding_model: string | null
  embedding_source_hash: string | null
  embedding_updated_at: Date | null
  has_embedding: boolean
}

// 공개 정보만 명시적으로 선택합니다. 식별자·관리 기록은 문서에 넣지 않습니다.
export const EMBEDDING_SOURCE_QUERY = Prisma.sql`
  SELECT c.uuid, c.embedding_model, c.embedding_source_hash, c.embedding_updated_at,
         c.embedding IS NOT NULL AS has_embedding,
         jsonb_build_object(
           'club', to_jsonb(info),
           'affiliation', jsonb_build_object('college', cm.college, 'major', cm.major),
           'latest_recruitment', to_jsonb(recruitment),
           'reviews', to_jsonb(reviews)
         ) AS document
  FROM public.club c

  CROSS JOIN LATERAL (
    SELECT c.name, c.short_description, c.description, c.introduction,
           c.article, c.article_uploaded_at, c.type, c.category, c.affiliation_type,
           c.has_dongbang, c.dongbang_location, c.min_activity_period,
           c.active_member_count, c.founded_at, c.recruit_type,
           c.is_official_verified, c.verified_at, c.sns, c.sns_urls,
           c.image_uri, c.activity_image_urls
  ) info
  LEFT JOIN public.college_major cm
    ON cm.id = c.college_major_id AND cm.deleted_at IS NULL

  LEFT JOIN LATERAL (
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
    ORDER BY r.year_month DESC, r.created_at DESC, r.id DESC
    LIMIT 1
  ) recruitment ON true

  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count,
           (SELECT jsonb_agg(to_jsonb(keyword_votes)) FROM (
             SELECT category.title AS category, keyword.title, COUNT(*) AS votes
             FROM public.user_club_review review
             JOIN public.club_review_keyword keyword
               ON keyword.id = ANY(review.review_keyword_ids) AND keyword.deleted_at IS NULL
             JOIN public.club_review_keyword_category category
               ON category.id = keyword.category_id AND category.deleted_at IS NULL
             WHERE review.club_id = c.uuid
             GROUP BY category.title, keyword.title
           ) keyword_votes) AS keywords
    FROM public.user_club_review
    WHERE club_id = c.uuid
  ) reviews ON true

  WHERE c.status = 'APPROVED' AND c.deleted_at IS NULL
`
