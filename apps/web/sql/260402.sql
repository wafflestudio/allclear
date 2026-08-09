/*
club 테이블의 필드 수정, 추가
*/
ALTER TABLE club DROP COLUMN is_approved;
ALTER TABLE club 
    ADD COLUMN status character varying NOT NULL DEFAULT 'PENDING',
    ADD COLUMN reject_reason character varying DEFAULT '';

UPDATE club SET status = 'APPROVED';