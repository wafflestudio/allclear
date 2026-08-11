/*
 * Entity에서 user.service 쓰기를 제거한 서버가 기존 DB에서도 사용자를 생성할 수 있도록
 * 배포 전에 호환용 기본값을 추가합니다.
 */

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public."user"
    WHERE service IS DISTINCT FROM 'allclear'
  ) THEN
    RAISE EXCEPTION 'user.service contains a value other than allclear';
  END IF;
END;
$$;

ALTER TABLE public."user"
ALTER COLUMN service SET DEFAULT 'allclear';
