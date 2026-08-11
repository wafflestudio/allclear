/*
 * 실행 보류: 삭제 예정 컬럼의 Entity 매핑을 제거한 서버가 모든 인스턴스에
 * 배포되고 정상 동작하는 것을 확인한 뒤 적용합니다.
 *
 * account.password는 OAuth 가입에서 빈 문자열만 저장하므로 제거합니다.
 * allclear_user의 기존 college/major는 명칭 정규화 이전 값이며,
 * 검증 결과 college_major_id 누락 및 잘못된 참조가 없음을 확인했습니다.
 * allclear_user의 grade 및 university 관련 컬럼은 저장된 유효 데이터와 사용처가 없어
 * 제거합니다.
 * user.service는 모든 행에서 allclear 고정값이므로 제거합니다.
 * v1 전용 club_manager_register_request는 현재 코드와 신규 요청 흐름에서 사용하지
 * 않으므로 제거합니다. club_manager_request는 유지합니다.
 * 리뷰 키워드 및 카테고리의 미사용 표시용 컬럼을 제거합니다.
 * club_review_keyword.icon_uri는 클라이언트에서 사용하므로 유지합니다.
 * user_club_review의 미사용 평점과 텍스트 후기 컬럼을 제거합니다.
 * user의 미사용 개인정보 및 이전 동의 상태 컬럼을 제거합니다.
 * 코드와 datasource에서 이미 제거됐고 비어 있는 device 테이블을 제거합니다.
 */

ALTER TABLE public.account
DROP COLUMN IF EXISTS password;

ALTER TABLE public.allclear_user
  DROP COLUMN IF EXISTS college,
  DROP COLUMN IF EXISTS major,
  DROP COLUMN IF EXISTS grade,
  DROP COLUMN IF EXISTS university_id,
  DROP COLUMN IF EXISTS is_university_confirmed,
  DROP COLUMN IF EXISTS university_confirmed_at;

DROP INDEX IF EXISTS public.ix_user_service;

ALTER TABLE public."user"
DROP COLUMN IF EXISTS service;

DROP TABLE IF EXISTS public.club_manager_register_request;

ALTER TABLE public.club_review_keyword
DROP COLUMN IF EXISTS color;

ALTER TABLE public.club_review_keyword_category
  DROP COLUMN IF EXISTS color,
  DROP COLUMN IF EXISTS icon_uri;

ALTER TABLE public.user_club_review
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS content;

ALTER TABLE public."user"
  DROP COLUMN IF EXISTS gender,
  DROP COLUMN IF EXISTS birth_date,
  DROP COLUMN IF EXISTS birth_year,
  DROP COLUMN IF EXISTS terms_of_service_agreement,
  DROP COLUMN IF EXISTS push_notification_agreement,
  DROP COLUMN IF EXISTS night_push_notification_agreement;

DROP TABLE IF EXISTS public.device;

DROP INDEX IF EXISTS public.ux_club_authkey;
DROP INDEX IF EXISTS public.ix_club_ispopular;

ALTER TABLE public.club
  DROP COLUMN IF EXISTS full_name,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS is_popular,
  DROP COLUMN IF EXISTS thumbnail_uri,
  DROP COLUMN IF EXISTS activity_cycle,
  DROP COLUMN IF EXISTS membership_fee,
  DROP COLUMN IF EXISTS blur_image,
  DROP COLUMN IF EXISTS blur_hash,
  DROP COLUMN IF EXISTS authkey,
  DROP COLUMN IF EXISTS college;
