/*
 * 동아리 의미 검색 — text-embedding-3-small, 1536차원
 *
 * 적용 후 /admin/update-embedding에서 최초 생성 / 월 1회 갱신합니다.
 * 원문이 바뀌어도 다음 수동 갱신까지 기존 벡터를 사용합니다.
 * source_hash로 변경 여부를 확인하므로 자동 갱신 트리거는 필요 없습니다.
 * 공개 동아리 정보·Article·소속·최신 모집·정기 모임·후기 집계를 JSON으로 임베딩합니다.
 * 긴 문서는 조각별 벡터를 토큰 수로 가중 평균하고 정규화해 같은 컬럼에 저장합니다.
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
  '공개 동아리 정보와 연관 정보로 만든 검색 문서의 임베딩. 미생성 시 NULL.';
COMMENT ON COLUMN public.club.embedding_model IS
  '모델 / 차원 / 문서 입력 버전. 검색어와 같은 모델·차원을 사용하며 버전 변경 시 재생성한다.';
COMMENT ON COLUMN public.club.embedding_source_hash IS
  '정규화한 전체 검색 문서 JSON의 SHA-256. 연관 정보가 변경되어도 수동 갱신 대상이 된다.';

COMMIT;
