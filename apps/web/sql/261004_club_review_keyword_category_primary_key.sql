/*
 * club_review_keyword_category.id is generated and NOT NULL, but the table has
 * no primary key or unique constraint. Add the primary key so the database
 * enforces the identifier already declared by the TypeORM entity.
 *
 * Apply after the existing SQL through 260904. A duplicate id aborts the
 * transaction without changing the table.
 */

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT id
    FROM public.club_review_keyword_category
    GROUP BY id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'club_review_keyword_category contains duplicate ids';
  END IF;
END
$$;

ALTER TABLE public.club_review_keyword_category
  ADD CONSTRAINT club_review_keyword_category_pkey PRIMARY KEY (id);

COMMIT;
