/* 공식 인증 요청별 시도 번호를 보존합니다. */

ALTER TABLE public.club_verification_request
ADD COLUMN attempt_no smallint;

WITH numbered_requests AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY club_id ORDER BY created_at ASC, id ASC) AS attempt_no
  FROM public.club_verification_request
)
UPDATE public.club_verification_request AS request
SET attempt_no = numbered_requests.attempt_no
FROM numbered_requests
WHERE request.id = numbered_requests.id;

ALTER TABLE public.club_verification_request
ALTER COLUMN attempt_no SET NOT NULL,
ADD CONSTRAINT chk_club_verification_request_attempt_no_positive CHECK (attempt_no >= 1),
ADD CONSTRAINT uq_club_verification_request_attempt_no UNIQUE (club_id, attempt_no);

CREATE INDEX IF NOT EXISTS idx_club_verification_request_latest
ON public.club_verification_request (club_id, created_at DESC, id DESC);
