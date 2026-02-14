CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    anon_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_or_anon CHECK (email IS NOT NULL OR anon_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS planners (
    id SERIAL PRIMARY KEY,
    public_id UUID DEFAULT gen_random_uuid() UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Battle Plan',
    map_url TEXT,
    state JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_planners_public_id ON planners(public_id);

CREATE TABLE IF NOT EXISTS tablet_permissions (
    tablet_id INTEGER REFERENCES planners(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    can_edit BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (tablet_id, user_id)
);

CREATE TABLE IF NOT EXISTS tablet_sessions (
    tablet_id INTEGER REFERENCES planners(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tablet_id, user_id)
);