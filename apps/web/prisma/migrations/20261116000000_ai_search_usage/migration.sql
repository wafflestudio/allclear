-- 계정별 하루 AI 검색 횟수를 셉니다. usage_date는 KST 날짜입니다.
-- 지난 날짜의 row는 서버가 지우므로, 테이블에는 최근 사용량만 남습니다.
BEGIN;

CREATE TABLE public.ai_search_usage (
  usage_date date    NOT NULL,
  account_id uuid    NOT NULL,
  count      integer NOT NULL DEFAULT 1,

  CONSTRAINT ai_search_usage_pkey PRIMARY KEY (usage_date, account_id)
);

COMMIT;
