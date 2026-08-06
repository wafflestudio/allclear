/*
- 동아리별 총동연 공식 인증 대기 요청을 최대 1개로 제한
*/

CREATE UNIQUE INDEX IF NOT EXISTS uq_club_verification_request_pending
ON public.club_verification_request (club_id)
WHERE status = 'PENDING';
