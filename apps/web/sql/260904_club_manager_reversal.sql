/*
 * 동아리 관리자 역방향 권한 이전 허용
 *
 * club_manager의 soft-deleted 행은 관리자 이력으로 보존합니다. 따라서 동일한
 * 사용자가 같은 동아리의 관리자가 다시 될 수 있도록 전체 이력에 적용되던
 * (club_id, service_user_id) UNIQUE 제약을 제거합니다.
 *
 * 활성 관리자 한 명 제약은 deleted_at IS NULL인 행에만 적용되는 partial unique
 * index로 계속 보장합니다.
 */

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT club_id
    FROM public.club_manager
    WHERE deleted_at IS NULL
    GROUP BY club_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'active club_manager duplicates must be resolved before migration';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_club_manager_active_club
ON public.club_manager (club_id)
WHERE deleted_at IS NULL;

ALTER TABLE public.club_manager
  DROP CONSTRAINT IF EXISTS club_manager_clubid_serviceuserid;

COMMIT;

/*
 * Rollback (애플리케이션 롤백 후 수동 실행)
 *
 * 이 migration 적용 뒤 A -> B -> A 이전이 한 번이라도 완료되면 같은
 * (club_id, service_user_id) 이력 행이 둘 이상 생기므로 아래 UNIQUE 제약은
 * 그대로 복원할 수 없습니다. 롤백 전에 중복 이력을 별도 보관·정리하고 다음을
 * 실행해야 합니다. 활성 관리자 partial unique index는 제거하지 않습니다.
 *
 * SELECT club_id, service_user_id, COUNT(*)
 * FROM public.club_manager
 * GROUP BY club_id, service_user_id
 * HAVING COUNT(*) > 1;
 *
 * ALTER TABLE public.club_manager
 *   ADD CONSTRAINT club_manager_clubid_serviceuserid
 *   UNIQUE (club_id, service_user_id);
 */
