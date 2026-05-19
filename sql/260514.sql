/*
- 사용자별 최근 검색어 저장 테이블 추가
- 사용자별 최신순 조회와 8개 초과 cleanup을 위한 (service_user_id, updated_at DESC) 인덱스
- 같은 사용자의 같은 검색어 중복을 막기 위한 (service_user_id, query) unique 인덱스
  같은 검색어 재저장 시 ON CONFLICT DO UPDATE로 updated_at만 갱신한다
*/

CREATE TABLE IF NOT EXISTS public.user_recent_search (
  id BIGSERIAL PRIMARY KEY,
  service_user_id UUID NOT NULL,
  query TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE INDEX IF NOT EXISTS ix_user_recent_search_service_user_updated_at
  ON public.user_recent_search (service_user_id, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_recent_search_service_user_query
  ON public.user_recent_search (service_user_id, query);
