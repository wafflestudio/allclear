-- text-embedding-3-large의 기본 3072차원을 사용합니다.
-- 기존 1536차원 벡터는 변환할 수 없으므로 초기화한 뒤 관리자 화면에서 재생성합니다.
-- 실행 중인 임베딩 갱신을 마친 후 적용하고, 새 앱 배포 후 갱신을 다시 실행합니다.
BEGIN;

ALTER TABLE public.club
  ALTER COLUMN embedding TYPE vector(3072) USING NULL::vector(3072);

UPDATE public.club
SET embedding_model = NULL,
    embedding_source_hash = NULL,
    embedding_updated_at = NULL
WHERE embedding_model IS NOT NULL
   OR embedding_source_hash IS NOT NULL
   OR embedding_updated_at IS NOT NULL;

COMMENT ON COLUMN public.club.embedding IS
  '공개 동아리 정보와 연관 정보로 만든 검색 문서의 3072차원 임베딩. 미생성 시 NULL.';

COMMIT;
