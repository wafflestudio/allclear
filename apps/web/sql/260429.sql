/*
- club 테이블에 is_official_verified, verified_at 추가
- club_manager_request 테이블 생성
- club_verification_request 테이블 생성
- club_recruitment 테이블 생성
- regular_meeting 테이블 생성
- college_major 테이블의 major를 정확한 값으로 수정
- college_major 테이블에 행 추가

- old_club_manager 테이블 생성 및 데이터 백업
- club_manager 테이블 데이터 삭제
*/
ALTER TABLE club
ADD COLUMN is_official_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN verified_at TIMESTAMP WITHOUT TIME ZONE;


CREATE TABLE public.club_manager_request (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	club_id uuid NOT NULL,
	service_user_id uuid NOT NULL,
	name character varying NOT NULL,
	phone character varying NOT NULL,
	student_id character varying NOT NULL,
	status character varying NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
	reject_reason character varying,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT chk_manager_request_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);


CREATE TABLE public.club_verification_request (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  club_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  reject_reason character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chk_club_verification_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);



CREATE TABLE public.club_recruitment (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  club_id uuid NOT NULL,
  title character varying NOT NULL DEFAULT ''::character varying,
  deadline timestamp with time zone NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT false,
  has_regular_meeting boolean NOT NULL DEFAULT false,
  activity_location_type character varying NOT NULL DEFAULT '미정'::character varying, -- 동방, 동방 외, 미정
  activity_location_text character varying NOT NULL DEFAULT ''::character varying,
  has_eligibility boolean NOT NULL DEFAULT false,
  eligibility_text character varying NOT NULL DEFAULT ''::character varying,
  has_capacity_limit boolean NOT NULL DEFAULT false,
  capacity_limit_text character varying NOT NULL DEFAULT ''::character varying, 
  has_membership_fee boolean NOT NULL DEFAULT false,
  membership_fee_text character varying NOT NULL DEFAULT ''::character varying,
  application_url character varying NOT NULL DEFAULT ''::character varying,
  application_process character varying NOT NULL DEFAULT ''::character varying,
  full_recruitment_text character varying,
  image_urls JSONB DEFAULT '[]',
  year_month character varying NOT NULL, -- 'YYYY-MM' 형식
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT chk_activity_location_type CHECK (activity_location_type IN ('동방', '동방 외', '미정'))
);

CREATE INDEX idx_recruitment_club_id ON public.club_recruitment(club_id);
CREATE INDEX idx_recruitment_deadline ON public.club_recruitment(deadline);

-- 월별 1회 제한 유니크 인덱스 (삭제되지 않은 데이터 중 동아리당 월 1회만 허용)
CREATE UNIQUE INDEX idx_unique_club_month_active 
ON public.club_recruitment (club_id, year_month) 
WHERE deleted_at IS NULL;


CREATE TABLE public.regular_meeting (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  club_recruitment_id bigint NOT NULL,
  day_of_week character varying NOT NULL DEFAULT '월요일'::character varying,
	start_time time,
	end_time time,
	CONSTRAINT chk_day_of_week 
    CHECK (day_of_week IN ('월요일','화요일','수요일','목요일','금요일','토요일','일요일'))
);

-- college_major의 major를 정확한 값으로 수정
UPDATE public.college_major SET major = '고고미술사학과' WHERE major = '고고미술사학';
UPDATE public.college_major SET major = '철학과'        WHERE major = '철학';
UPDATE public.college_major SET major = '종교학과'      WHERE major = '종교학';
UPDATE public.college_major SET major = '미학과'        WHERE major = '미학';
UPDATE public.college_major SET major = '언론정보학과'  WHERE major = '언론정보학';
UPDATE public.college_major SET major = '건설환경도시공학부'    WHERE major = '건설환경공학부';
UPDATE public.college_major SET major = '전기·정보공학부'      WHERE major = '전기정보공학부';
UPDATE public.college_major SET major = '식품·동물생명공학부'  WHERE major = '식품동물생명공학부';
UPDATE public.college_major SET major = '바이오시스템·소재학부'    WHERE major = '바이오시스템소재학부';
UPDATE public.college_major SET major = '조경·지역시스템공학부'    WHERE major = '조경지역시스템공학부';

INSERT INTO public.college_major (college, major) VALUES ('사범대학', '융합학습과학전공');


-- college를 nullable하게 변경
ALTER TABLE public.college_major ALTER COLUMN college DROP NOT NULL;

-- 데이터 삽입
INSERT INTO public.college_major (college, major) VALUES
(NULL, '연합전공 계산과학'),
(NULL, '연합전공 글로벌환경영학'),
(NULL, '연합전공 기술경영'),
(NULL, '연합전공 영상매체예술'),
(NULL, '연합전공 정보문화학'),
(NULL, '연합전공 벤처경영학'),
(NULL, '연합전공 동아시아비교인문학'),
(NULL, '연합전공 인공지능'),
(NULL, '연합전공 인공지능반도체공학'),
(NULL, '연합전공 지능형통신'),
(NULL, '연합전공 정치-경제-철학'),
(NULL, '연계전공 고전문헌학'),
(NULL, '연계전공 라틴아메리카학'),
(NULL, '연계전공 인문데이터과학'),
(NULL, '연계전공 뇌-마음-행동'),
(NULL, '연계전공 금융경제'),
(NULL, '연계전공 금융수학'),
(NULL, '연계전공 과학기술학'),
(NULL, '연계전공 학습과학'),
(NULL, '연계전공 영화영상학');

-- old_club_manager 테이블 생성 및 데이터 백업
CREATE TABLE old_club_manager
(LIKE club_manager INCLUDING ALL);

INSERT INTO old_club_manager
SELECT *
FROM club_manager;

-- club_manager 테이블 데이터 삭제
TRUNCATE TABLE club_manager;
