CREATE TABLE IF NOT EXISTS presents (
    slug VARCHAR(32) PRIMARY KEY,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS publication_records (
    id BIGSERIAL PRIMARY KEY,
    client_ip VARCHAR(45) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_publication_records_ip_published_at
    ON publication_records (client_ip, published_at);
