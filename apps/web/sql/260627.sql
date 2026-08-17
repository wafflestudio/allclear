/*
- 간호대학, 경영대학, 자유전공학부 소속동아리의 college_major_id 업데이트
*/

UPDATE club
SET college_major_id = cm.id
FROM college_major cm
WHERE club.college = cm.college
  AND club.affiliation_type = '소속동아리'
  AND club.college IN ('간호대학', '경영대학', '자유전공학부');
