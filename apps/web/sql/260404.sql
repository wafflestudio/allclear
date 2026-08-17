/*
- club 테이블에 필드 추가
- club_managet 테이블에 필드 추가
- club_history 테이블 생성
*/

ALTER TABLE club
  ADD COLUMN short_description character varying NOT NULL DEFAULT '',
  ADD COLUMN dongbang_location character varying DEFAULT '',
  ADD COLUMN min_activity_period integer NOT NULL DEFAULT 0,
  ADD COLUMN active_member_count integer NOT NULL DEFAULT 0,
  ADD COLUMN sns character varying NOT NULL DEFAULT '';


UPDATE club
SET recruit_type = CASE 
    WHEN recruit_type = '' OR recruit_type IS NULL THEN '미정'
    WHEN recruit_type IN ('매 학기', '매 년') THEN '정기'
    ELSE recruit_type -- 그 외 '정기' 등 기존 값은 그대로 유지
END
WHERE recruit_type IN ('', '매 학기', '매 년') OR recruit_type IS NULL;


ALTER TABLE club
  ADD CONSTRAINT chk_affiliation_type 
  CHECK (affiliation_type IN ('중앙동아리', '소속동아리', '연합동아리', '기타'));

ALTER TABLE club
  ADD CONSTRAINT chk_club_status 
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE club 
	ADD CONSTRAINT chk_club_recruit_type 
	CHECK (recruit_type IN ('정기', '상시', '미정'));


ALTER TABLE public.club_manager
  ADD COLUMN name character varying NOT NULL DEFAULT '',
  ADD COLUMN phone character varying NOT NULL DEFAULT '',
  ADD COLUMN student_id character varying NOT NULL DEFAULT '';


CREATE TABLE public.club_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  club_id uuid NOT NULL,
  service_user_id uuid NOT NULL,
  before_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  changed_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_club_history_club_id ON public.club_history(club_id);
CREATE INDEX idx_club_history_created_at ON public.club_history(created_at DESC);