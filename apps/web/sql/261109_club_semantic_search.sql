/*
 * 동아리 의미 검색 — text-embedding-3-small, 1536차원
 *
 * 적용 후 /admin/update-embedding에서 최초 생성 / 월 1회 갱신합니다.
 * 원문이 바뀌어도 다음 수동 갱신까지 기존 벡터를 사용합니다.
 * source_hash로 변경 여부를 확인하므로 자동 갱신 트리거는 필요 없습니다.
 * 동아리 수가 적으므로 필터를 적용한 정확한 거리 검색으로 시작합니다.
 */

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.club
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_model text,
  ADD COLUMN IF NOT EXISTS embedding_source_hash text,
  ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;

COMMENT ON COLUMN public.club.embedding IS
  'name, short_description, description, introduction의 임베딩. 미생성 시 NULL.';
COMMENT ON COLUMN public.club.embedding_model IS
  '검색어와 동아리에 동일한 모델 / 차원 / 입력 처리 버전을 사용한다.';
COMMENT ON COLUMN public.club.embedding_source_hash IS
  '네 원문 컬럼의 SHA-256. 마지막 생성 이후 변경된 동아리만 갱신한다.';

COMMIT;
