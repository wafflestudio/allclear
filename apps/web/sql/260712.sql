/*
- 사용자 알림 metadata 컬럼 추가
- 반려 알림에서 rejectReason을 metadata에 저장하기 위한 컬럼
*/

ALTER TABLE public.user_notification
ADD COLUMN IF NOT EXISTS metadata jsonb;
