/*
 * Align the dev database with the production column definitions before
 * registering the Prisma 0_init baseline. Production already has these values.
 */

BEGIN;

ALTER TABLE public.account
  ALTER COLUMN username TYPE varchar(255);

ALTER TABLE public.club
  ALTER COLUMN reject_reason SET DEFAULT '';

COMMIT;
