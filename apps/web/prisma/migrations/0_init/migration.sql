-- Baseline of the dev database after 260904 and the club review category primary key.
-- Existing databases must mark this migration as applied; run it only on an empty database.
-- Objects below are required by defaults and a legacy function, but are not emitted by Prisma Migrate.
CREATE SCHEMA IF NOT EXISTS "public";
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "type" VARCHAR(20) NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "social_info" JSON,
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "auth_token" VARCHAR(200),

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_user" (
    "account_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT "account_user_pkey" PRIMARY KEY ("account_id","user_id")
);

-- CreateTable
CREATE TABLE "allclear_user" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "admission_class" SMALLINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "college_major_id" INTEGER,

    CONSTRAINT "allclear_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "start_at" TIMESTAMP(6) NOT NULL,
    "end_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_dismiss" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "dismissed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_dismiss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_version_policy" (
    "client_type" VARCHAR(16) NOT NULL,
    "min_supported_version" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT "app_version_policy_pkey" PRIMARY KEY ("client_type")
);

-- CreateTable
CREATE TABLE "club" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL DEFAULT '',
    "type" VARCHAR NOT NULL DEFAULT '',
    "category" VARCHAR NOT NULL DEFAULT '',
    "article" VARCHAR DEFAULT '',
    "article_uploaded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "has_dongbang" BOOLEAN NOT NULL DEFAULT false,
    "recruit_type" VARCHAR DEFAULT '',
    "introduction" VARCHAR DEFAULT '',
    "uuid" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "image_uri" VARCHAR(300) NOT NULL DEFAULT '',
    "affiliation_type" VARCHAR NOT NULL DEFAULT '',
    "college_major_id" INTEGER,
    "approved_at" TIMESTAMP(6),
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "reject_reason" VARCHAR,
    "short_description" VARCHAR NOT NULL DEFAULT '',
    "dongbang_location" VARCHAR DEFAULT '',
    "min_activity_period" INTEGER NOT NULL DEFAULT 0,
    "active_member_count" INTEGER NOT NULL DEFAULT 0,
    "sns" VARCHAR NOT NULL DEFAULT '',
    "is_official_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(6),
    "founded_at" DATE,
    "sns_urls" JSONB NOT NULL DEFAULT '[]',
    "activity_image_urls" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "club_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "club_history" (
    "id" BIGSERIAL NOT NULL,
    "club_id" UUID NOT NULL,
    "service_user_id" UUID NOT NULL,
    "before_data" JSONB NOT NULL DEFAULT '{}',
    "after_data" JSONB NOT NULL DEFAULT '{}',
    "changed_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_manager" (
    "id" SERIAL NOT NULL,
    "club_id" UUID NOT NULL,
    "service_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "name" VARCHAR NOT NULL DEFAULT '',
    "phone" VARCHAR NOT NULL DEFAULT '',
    "student_id" VARCHAR NOT NULL DEFAULT '',

    CONSTRAINT "club_manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_manager_request" (
    "id" BIGSERIAL NOT NULL,
    "club_id" UUID NOT NULL,
    "service_user_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,
    "student_id" VARCHAR NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "reject_reason" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_manager_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_manager_transfer_invitation" (
    "id" BIGSERIAL NOT NULL,
    "club_id" UUID NOT NULL,
    "sender_service_user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "accepted_by_service_user_id" UUID,
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_manager_transfer_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_recruitment" (
    "id" BIGSERIAL NOT NULL,
    "club_id" UUID NOT NULL,
    "title" VARCHAR NOT NULL DEFAULT '',
    "deadline" TIMESTAMPTZ(6) NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "has_regular_meeting" BOOLEAN NOT NULL DEFAULT false,
    "activity_location_type" VARCHAR NOT NULL DEFAULT '미정',
    "activity_location_text" VARCHAR NOT NULL DEFAULT '',
    "has_eligibility" BOOLEAN NOT NULL DEFAULT false,
    "eligibility_text" VARCHAR NOT NULL DEFAULT '',
    "has_capacity_limit" BOOLEAN NOT NULL DEFAULT false,
    "capacity_limit_text" VARCHAR NOT NULL DEFAULT '',
    "has_membership_fee" BOOLEAN NOT NULL DEFAULT false,
    "membership_fee_text" VARCHAR NOT NULL DEFAULT '',
    "application_url" VARCHAR NOT NULL DEFAULT '',
    "application_process" VARCHAR NOT NULL DEFAULT '',
    "full_recruitment_text" VARCHAR,
    "image_urls" JSONB DEFAULT '[]',
    "year_month" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "club_recruitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_review_keyword" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "category_id" BIGINT NOT NULL,
    "sort_order" SMALLINT NOT NULL,
    "title" VARCHAR(64) NOT NULL,
    "icon_uri" VARCHAR(128) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "club_review_keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_review_keyword_category" (
    "id" BIGSERIAL NOT NULL,
    "sort_order" SMALLINT NOT NULL,
    "title" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "club_review_keyword_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_verification_request" (
    "id" BIGSERIAL NOT NULL,
    "club_id" UUID NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "reject_reason" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempt_no" SMALLINT NOT NULL,
    "term_key" VARCHAR(6) NOT NULL,

    CONSTRAINT "club_verification_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_major" (
    "id" SERIAL NOT NULL,
    "college" VARCHAR(50),
    "major" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "college_major_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "old_club_manager" (
    "id" SERIAL NOT NULL,
    "club_id" UUID NOT NULL,
    "service_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "name" VARCHAR NOT NULL DEFAULT '',
    "phone" VARCHAR NOT NULL DEFAULT '',
    "student_id" VARCHAR NOT NULL DEFAULT '',

    CONSTRAINT "old_club_manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regular_meeting" (
    "id" BIGSERIAL NOT NULL,
    "club_recruitment_id" BIGINT NOT NULL,
    "day_of_week" VARCHAR NOT NULL DEFAULT '월요일',
    "start_time" TIME(6),
    "end_time" TIME(6),

    CONSTRAINT "regular_meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "content_url" VARCHAR(255) NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "terms_key" VARCHAR(64) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_agreement" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "terms_id" INTEGER NOT NULL,
    "agreed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "nickname" VARCHAR(32) NOT NULL DEFAULT '',
    "name" VARCHAR(32) NOT NULL DEFAULT '',
    "phone" VARCHAR(32) NOT NULL DEFAULT '',
    "email" VARCHAR(80) NOT NULL DEFAULT '',
    "role" VARCHAR(32) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_log" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR NOT NULL,
    "user_device" VARCHAR NOT NULL DEFAULT '',
    "user_ip" VARCHAR NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "params" VARCHAR,

    CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_club_review" (
    "id" SERIAL NOT NULL,
    "club_id" UUID NOT NULL,
    "service_user_id" UUID NOT NULL,
    "review_keyword_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT "user_club_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification" (
    "id" BIGSERIAL NOT NULL,
    "service_user_id" UUID NOT NULL,
    "type" VARCHAR NOT NULL,
    "club_id" UUID,
    "source_type" VARCHAR NOT NULL,
    "source_id" VARCHAR NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "user_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_recent_search" (
    "id" BIGSERIAL NOT NULL,
    "service_user_id" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT "user_recent_search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saved_club" (
    "id" SERIAL NOT NULL,
    "service_user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT "user_saved_club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_voice" (
    "id" BIGSERIAL NOT NULL,
    "service_user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT "user_voice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_account_type_username" ON "account"("type", "username");

-- CreateIndex
CREATE INDEX "ix_allclear_user_user_id" ON "allclear_user"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_announcement_uuid" ON "announcement"("uuid");

-- CreateIndex
CREATE INDEX "ix_announcement_dismiss_user_id" ON "announcement_dismiss"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_announcement_dismiss_announcement_user" ON "announcement_dismiss"("announcement_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_club_uuid" ON "club"("uuid");

-- CreateIndex
CREATE INDEX "idx_club_search_affiliation_type" ON "club"("affiliation_type") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_club_search_has_dongbang" ON "club"("has_dongbang") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_club_search_is_official_verified" ON "club"("is_official_verified") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_club_search_min_activity_period" ON "club"("min_activity_period") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_club_search_recruit_type" ON "club"("recruit_type") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "ix_club_category" ON "club"("category");

-- CreateIndex
CREATE INDEX "idx_club_history_club_id" ON "club_history"("club_id");

-- CreateIndex
CREATE INDEX "idx_club_history_created_at" ON "club_history"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_club_manager_active_club" ON "club_manager"("club_id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_club_manager_service_user_created" ON "club_manager"("service_user_id", "created_at" DESC) WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_club_manager_request_service_user_status_created" ON "club_manager_request"("service_user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_club_manager_transfer_active_club" ON "club_manager_transfer_invitation"("club_id") WHERE ((revoked_at IS NULL) AND (accepted_at IS NULL));

-- CreateIndex
CREATE UNIQUE INDEX "uq_club_manager_transfer_token_hash" ON "club_manager_transfer_invitation"("token_hash");

-- CreateIndex
CREATE INDEX "idx_club_recruitment_club_updated" ON "club_recruitment"("club_id", "updated_at" DESC) WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_recruitment_active_by_club_deadline" ON "club_recruitment"("club_id", "deadline") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_recruitment_club_id" ON "club_recruitment"("club_id");

-- CreateIndex
CREATE INDEX "idx_recruitment_deadline" ON "club_recruitment"("deadline");

-- CreateIndex
CREATE INDEX "idx_recruitment_latest_by_club" ON "club_recruitment"("club_id", "year_month" DESC, "created_at" DESC) WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_recruitment_membership_fee_by_club" ON "club_recruitment"("club_id", "has_membership_fee") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "idx_unique_club_month_active" ON "club_recruitment"("club_id", "year_month") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "uq_club_verification_request_club" ON "club_verification_request"("club_id");

-- CreateIndex
CREATE INDEX "idx_club_verification_request_term_status_requested" ON "club_verification_request"("term_key", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "old_club_manager_club_id_service_user_id_key" ON "old_club_manager"("club_id", "service_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_terms_uuid" ON "terms"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_terms_per_key" ON "terms"("terms_key") WHERE (active = true);

-- CreateIndex
CREATE UNIQUE INDEX "ux_terms_key_version" ON "terms"("terms_key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ux_terms_agreement_user_terms" ON "terms_agreement"("user_id", "terms_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_user_club_review_clubid_serviceuserid" ON "user_club_review"("club_id", "service_user_id");

-- CreateIndex
CREATE INDEX "idx_user_notification_service_user_created" ON "user_notification"("service_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_user_notification_service_user_unread_created" ON "user_notification"("service_user_id", "created_at" DESC) WHERE (read_at IS NULL);

-- CreateIndex
CREATE INDEX "ix_user_recent_search_service_user_updated_at" ON "user_recent_search"("service_user_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ux_user_recent_search_service_user_query" ON "user_recent_search"("service_user_id", "query");

-- CreateIndex
CREATE UNIQUE INDEX "ux_user_saved_club_serviceuserid_clubid" ON "user_saved_club"("service_user_id", "club_id");

-- AddForeignKey
ALTER TABLE "announcement_dismiss" ADD CONSTRAINT "fk_announcement_dismiss_announcement" FOREIGN KEY ("announcement_id") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_dismiss" ADD CONSTRAINT "fk_announcement_dismiss_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terms_agreement" ADD CONSTRAINT "fk_terms_agreement_terms" FOREIGN KEY ("terms_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terms_agreement" ADD CONSTRAINT "fk_terms_agreement_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Database features that Prisma Schema cannot fully represent.
-- Prisma emits the following UNIQUE constraints as standalone indexes.
-- Attach those indexes as constraints to match the existing database catalog.
ALTER TABLE "public"."announcement" ADD CONSTRAINT "ux_announcement_uuid" UNIQUE USING INDEX "ux_announcement_uuid";
ALTER TABLE "public"."announcement_dismiss" ADD CONSTRAINT "ux_announcement_dismiss_announcement_user" UNIQUE USING INDEX "ux_announcement_dismiss_announcement_user";
ALTER TABLE "public"."club" ADD CONSTRAINT "ux_club_uuid" UNIQUE USING INDEX "ux_club_uuid";
ALTER TABLE "public"."club_manager_transfer_invitation" ADD CONSTRAINT "uq_club_manager_transfer_token_hash" UNIQUE USING INDEX "uq_club_manager_transfer_token_hash";
ALTER TABLE "public"."club_verification_request" ADD CONSTRAINT "uq_club_verification_request_club" UNIQUE USING INDEX "uq_club_verification_request_club";
ALTER TABLE "public"."old_club_manager" ADD CONSTRAINT "old_club_manager_club_id_service_user_id_key" UNIQUE USING INDEX "old_club_manager_club_id_service_user_id_key";
ALTER TABLE "public"."terms" ADD CONSTRAINT "ux_terms_key_version" UNIQUE USING INDEX "ux_terms_key_version";
ALTER TABLE "public"."terms" ADD CONSTRAINT "ux_terms_uuid" UNIQUE USING INDEX "ux_terms_uuid";
ALTER TABLE "public"."terms_agreement" ADD CONSTRAINT "ux_terms_agreement_user_terms" UNIQUE USING INDEX "ux_terms_agreement_user_terms";

ALTER TABLE "public"."announcement" ADD CONSTRAINT "ck_announcement_period" CHECK (((end_at IS NULL) OR (end_at >= start_at)));
ALTER TABLE "public"."app_version_policy" ADD CONSTRAINT "ck_app_version_policy_client_type" CHECK (client_type IN ('android', 'ios'));
ALTER TABLE "public"."app_version_policy" ADD CONSTRAINT "ck_app_version_policy_min_supported_version" CHECK (((min_supported_version)::text ~ '^[0-9]+(\.[0-9]+){0,3}$'::text));
ALTER TABLE "public"."club" ADD CONSTRAINT "chk_affiliation_type" CHECK (affiliation_type IN ('중앙동아리', '소속동아리', '연합동아리', '기타'));
ALTER TABLE "public"."club" ADD CONSTRAINT "chk_club_recruit_type" CHECK (recruit_type IN ('정기', '상시', '미정'));
ALTER TABLE "public"."club" ADD CONSTRAINT "chk_club_status" CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE "public"."club_manager_request" ADD CONSTRAINT "chk_manager_request_status" CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE "public"."club_manager_transfer_invitation" ADD CONSTRAINT "chk_club_manager_transfer_acceptance" CHECK ((((accepted_by_service_user_id IS NULL) AND (accepted_at IS NULL)) OR ((accepted_by_service_user_id IS NOT NULL) AND (accepted_at IS NOT NULL))));
ALTER TABLE "public"."club_recruitment" ADD CONSTRAINT "chk_activity_location_type" CHECK (activity_location_type IN ('동방', '동방 외', '미정'));
ALTER TABLE "public"."club_verification_request" ADD CONSTRAINT "chk_club_verification_request_attempt_no_range" CHECK (((attempt_no >= 1) AND (attempt_no <= 4)));
ALTER TABLE "public"."club_verification_request" ADD CONSTRAINT "chk_club_verification_request_term_key" CHECK (((term_key)::text ~ '^[0-9]{4}-[12]$'::text));
ALTER TABLE "public"."club_verification_request" ADD CONSTRAINT "chk_club_verification_status" CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE "public"."regular_meeting" ADD CONSTRAINT "chk_day_of_week" CHECK (day_of_week IN ('월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'));
ALTER TABLE "public"."user_notification" ADD CONSTRAINT "chk_user_notification_source_type" CHECK (source_type IN ('CLUB', 'CLUB_MANAGER_REQUEST', 'MANAGER_TRANSFER'));
ALTER TABLE "public"."user_notification" ADD CONSTRAINT "chk_user_notification_type" CHECK (type IN ('CLUB_REGISTRATION_APPROVED', 'CLUB_REGISTRATION_REJECTED', 'MANAGER_REQUEST_APPROVED', 'MANAGER_REQUEST_REJECTED', 'MANAGER_TRANSFER_COMPLETED'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.yongin_search(query_embedding vector, similarity_threshold double precision, match_count integer)
 RETURNS TABLE(id bigint, board text, title text, content text, similarity double precision, inserted_at timestamp without time zone)
 LANGUAGE plpgsql
AS $function$
begin
  return query
  select
    yongin.id,
    yongin.board,
    yongin.title,
    yongin.content,
    1 - (yongin.embedding <=> query_embedding) as similarity,
    yongin.inserted_at
  from yongin
  where 1 - (yongin.embedding <=> query_embedding) > similarity_threshold
  order by yongin.embedding <=> query_embedding
  limit match_count;
  end;
  $function$;

CREATE TRIGGER trg_announcement_set_updated_at BEFORE UPDATE ON public.announcement FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE "public"."account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."account_user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."allclear_user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."club_manager" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."club_review_keyword" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."club_review_keyword_category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."college_major" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_activity_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_club_review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_saved_club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_voice" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allclearuser-authenticated" ON "public"."allclear_user" AS PERMISSIVE FOR SELECT TO "authenticated", "service_role" USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."club" AS PERMISSIVE FOR SELECT TO "anon", "authenticated", "pgsodium_keyholder", "pgsodium_keyiduser", "pgsodium_keymaker", "pgtle_admin", "service_role", "supabase_read_only_user", "supabase_replication_admin" USING (true);
CREATE POLICY "user-authenticated" ON "public"."user" AS PERMISSIVE FOR SELECT TO "authenticated", "service_role" USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON "public"."user_activity_log" AS PERMISSIVE FOR INSERT TO "anon", "authenticated" WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON "public"."user_activity_log" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

COMMENT ON COLUMN "public"."account"."auth_token" IS '마지막으로 발급한 인증 토큰 저장 ';
COMMENT ON COLUMN "public"."club"."image_uri" IS 'r2 storage custom domain uri';
COMMENT ON TABLE "public"."club" IS 'Club Table for Clubhouse';
COMMENT ON TABLE "public"."user_activity_log" IS '유저 활동 로그';
