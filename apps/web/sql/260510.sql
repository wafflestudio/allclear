/*
- 검색 필터(소속 타입, 모집 유형, 동방 보유, 공식 인증, 최소 활동 기간) 인덱스 추가
- 최신 유효 recruitment LATERAL JOIN 및 회비/모집 여부 필터를 위한 인덱스 추가
*/

CREATE INDEX IF NOT EXISTS idx_club_search_affiliation_type
  ON public.club(affiliation_type)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_search_recruit_type
  ON public.club(recruit_type)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_search_has_dongbang
  ON public.club(has_dongbang)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_search_is_official_verified
  ON public.club(is_official_verified)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_search_min_activity_period
  ON public.club(min_activity_period)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_recruitment_active_by_club_deadline
  ON public.club_recruitment(club_id, deadline)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_recruitment_membership_fee_by_club
  ON public.club_recruitment(club_id, has_membership_fee)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_recruitment_latest_by_club
  ON public.club_recruitment(club_id, year_month DESC, created_at DESC)
  WHERE deleted_at IS NULL;
