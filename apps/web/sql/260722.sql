/*
- 동아리 상세 개편에 필요한 설립일, SNS 목록, 활동 사진 목록 추가
*/

ALTER TABLE public.club
ADD COLUMN IF NOT EXISTS founded_at date,
ADD COLUMN IF NOT EXISTS sns_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS activity_image_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.club
SET sns_urls = jsonb_build_array(sns)
WHERE sns <> ''
  AND sns_urls = '[]'::jsonb;
