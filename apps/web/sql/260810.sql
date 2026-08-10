/* 공식 인증 요청은 동아리별 한 행만 유지하고 학기와 재요청 횟수를 행에 저장합니다. */

BEGIN;

ALTER TABLE public.club_verification_request
ADD COLUMN attempt_no smallint,
ADD COLUMN term_key character varying(6);

DROP INDEX IF EXISTS public.uq_club_verification_request_pending;

/* 기존 요청은 동아리별 최신 행 하나만 남깁니다. */
WITH ranked_requests AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY club_id
      ORDER BY created_at DESC, id DESC
    ) AS latest_rank
  FROM public.club_verification_request
)
DELETE FROM public.club_verification_request AS request
USING ranked_requests
WHERE request.id = ranked_requests.id
  AND ranked_requests.latest_rank > 1;

/* 남은 기존 요청은 모두 2026년 1학기의 첫 번째 요청으로 간주합니다. */
UPDATE public.club_verification_request
SET
  attempt_no = 1,
  term_key = '2026-1';

ALTER TABLE public.club_verification_request
ALTER COLUMN attempt_no SET NOT NULL,
ALTER COLUMN term_key SET NOT NULL,
ADD CONSTRAINT chk_club_verification_request_attempt_no_range CHECK (attempt_no BETWEEN 1 AND 4),
ADD CONSTRAINT chk_club_verification_request_term_key CHECK (term_key ~ '^[0-9]{4}-[12]$'),
ADD CONSTRAINT uq_club_verification_request_club UNIQUE (club_id);

CREATE INDEX idx_club_verification_request_term_status_requested
ON public.club_verification_request (term_key, status, created_at DESC, id DESC);

COMMIT;
