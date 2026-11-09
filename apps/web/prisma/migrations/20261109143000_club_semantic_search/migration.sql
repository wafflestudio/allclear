-- text-embedding-3-large, dimensions=1536. 생성/갱신은 관리자 화면에서 수동 실행합니다.
-- 기존에 수동 SQL을 적용한 DB도 데이터 삭제 없이 이 migration을 적용할 수 있습니다.
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
  '모델 / 차원 / 문서 입력 버전. 검색어와 동일한 모델·차원의 벡터만 비교한다.';
COMMENT ON COLUMN public.club.embedding_source_hash IS
  '정규화한 전체 검색 문서 JSON의 SHA-256. 연관 정보가 변경되어도 수동 갱신 대상이 된다.';

COMMIT;
