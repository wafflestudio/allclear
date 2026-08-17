/*
- club 테이블에 신규 필드 추가
- club 테이블의 affiliation_type은 기존의 college 필드로 추측해서 채워넣음
*/
ALTER TABLE club 
    ADD COLUMN affiliation_type character varying NOT NULL DEFAULT '',
    ADD COLUMN college_major_id integer;

ALTER TABLE college_major ALTER COLUMN major DROP NOT NULL;

INSERT INTO college_major (college, major)
SELECT college, NULL
FROM college_major
GROUP BY college
HAVING COUNT(*) > 1;

UPDATE club
SET affiliation_type = CASE 
    WHEN college IN ('단과대무관', '법과대학') THEN '기타'
    WHEN college = '연합동아리' THEN '연합동아리'
    WHEN college = '중앙동아리' THEN '중앙동아리'
    ELSE '소속동아리'
END;

UPDATE club
SET college_major_id = cm.id
FROM college_major cm
WHERE club.college = cm.college
  AND cm.major IS NULL
  AND club.affiliation_type = '소속동아리';

ALTER TABLE club 
  ADD COLUMN approved_at timestamp without time zone,
  ADD COLUMN is_approved boolean NOT NULL DEFAULT false;

UPDATE club 
SET 
  approved_at = now(), 
  is_approved = true;