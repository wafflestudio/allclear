/*
- Android/iOS 앱 진입 시 강제 업데이트 여부를 판단하기 위한 최소 지원 버전 정책 테이블
- client_type별로 하나의 정책만 유지한다
*/

CREATE TABLE IF NOT EXISTS public.app_version_policy (
  client_type VARCHAR(16) PRIMARY KEY,
  min_supported_version VARCHAR(32) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT ck_app_version_policy_client_type CHECK (client_type IN ('android', 'ios')),
  CONSTRAINT ck_app_version_policy_min_supported_version
    CHECK (min_supported_version ~ '^[0-9]+(\.[0-9]+){0,3}$')
);

INSERT INTO public.app_version_policy (client_type, min_supported_version)
VALUES
  ('android', '1.0.0'),
  ('ios', '1.0.0')
ON CONFLICT (client_type) DO NOTHING;
