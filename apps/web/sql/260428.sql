CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE announcement (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT ux_announcement_uuid UNIQUE (uuid),
    CONSTRAINT ck_announcement_period CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE TRIGGER trg_announcement_set_updated_at
    BEFORE UPDATE ON announcement
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TABLE terms (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content_url VARCHAR(255) NOT NULL,
    version VARCHAR(32) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT false,
    terms_key VARCHAR(64) NOT NULL,
    CONSTRAINT ux_terms_uuid UNIQUE (uuid),
    CONSTRAINT ux_terms_key_version UNIQUE (terms_key, version)
);

CREATE UNIQUE INDEX unique_active_terms_per_key
    ON terms (terms_key)
    WHERE active = true;

CREATE TABLE announcement_dismiss (
    id SERIAL PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id UUID NOT NULL,
    dismissed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_announcement_dismiss_announcement_user UNIQUE (announcement_id, user_id),
    CONSTRAINT fk_announcement_dismiss_announcement
        FOREIGN KEY (announcement_id) REFERENCES announcement (id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_dismiss_user
        FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX ix_announcement_dismiss_user_id ON announcement_dismiss (user_id);

CREATE TABLE terms_agreement (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    terms_id INT NOT NULL,
    agreed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_terms_agreement_user_terms UNIQUE (user_id, terms_id),
    CONSTRAINT fk_terms_agreement_user
        FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_terms_agreement_terms
        FOREIGN KEY (terms_id) REFERENCES terms (id) ON DELETE CASCADE
);
