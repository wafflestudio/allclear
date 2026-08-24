/*
 * 동아리 관리자 권한 이전
 *
 * 배포 전제:
 * - 동아리별 활성 관리자는 한 명이어야 합니다.
 * - 아래 DO 블록이 실패하면 중복 데이터를 먼저 정리하고 다시 실행합니다.
 */

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

CREATE TABLE public.club_manager_transfer_invitation (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  club_id uuid NOT NULL,
  sender_service_user_id uuid NOT NULL,
  token_hash character(64) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  accepted_by_service_user_id uuid,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_club_manager_transfer_token_hash UNIQUE (token_hash),
  CONSTRAINT chk_club_manager_transfer_acceptance
    CHECK (
      (accepted_by_service_user_id IS NULL AND accepted_at IS NULL)
      OR
      (accepted_by_service_user_id IS NOT NULL AND accepted_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_club_manager_transfer_active_club
ON public.club_manager_transfer_invitation (club_id)
WHERE revoked_at IS NULL AND accepted_at IS NULL;

ALTER TABLE public.user_notification
  DROP CONSTRAINT chk_user_notification_type,
  ADD CONSTRAINT chk_user_notification_type
    CHECK (
      type IN (
        'CLUB_REGISTRATION_APPROVED',
        'CLUB_REGISTRATION_REJECTED',
        'MANAGER_REQUEST_APPROVED',
        'MANAGER_REQUEST_REJECTED',
        'MANAGER_TRANSFER_COMPLETED'
      )
    ),
  DROP CONSTRAINT chk_user_notification_source_type,
  ADD CONSTRAINT chk_user_notification_source_type
    CHECK (source_type IN ('CLUB', 'CLUB_MANAGER_REQUEST', 'MANAGER_TRANSFER'));

/*
 * Rollback (애플리케이션 롤백 후 수동 실행)
 *
 * DELETE FROM public.user_notification
 * WHERE type = 'MANAGER_TRANSFER_COMPLETED' OR source_type = 'MANAGER_TRANSFER';
 *
 * ALTER TABLE public.user_notification
 *   DROP CONSTRAINT chk_user_notification_type,
 *   ADD CONSTRAINT chk_user_notification_type
 *     CHECK (
 *       type IN (
 *         'CLUB_REGISTRATION_APPROVED',
 *         'CLUB_REGISTRATION_REJECTED',
 *         'MANAGER_REQUEST_APPROVED',
 *         'MANAGER_REQUEST_REJECTED'
 *       )
 *     ),
 *   DROP CONSTRAINT chk_user_notification_source_type,
 *   ADD CONSTRAINT chk_user_notification_source_type
 *     CHECK (source_type IN ('CLUB', 'CLUB_MANAGER_REQUEST'));
 *
 * DROP TABLE IF EXISTS public.club_manager_transfer_invitation;
 * DROP INDEX IF EXISTS public.uq_club_manager_active_club;
 */
