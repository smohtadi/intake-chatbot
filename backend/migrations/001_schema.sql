-- Up Migration
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE role (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE session_format (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE areas_practice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE specialist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  role_id uuid NOT NULL REFERENCES role (id),
  description text NOT NULL,
  booking_url varchar(255) NOT NULL,
  profile_url varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  embedding vector(1024)
);

CREATE INDEX specialist_role_id_idx ON specialist (role_id);
CREATE INDEX specialist_embedding_idx ON specialist USING hnsw (embedding vector_cosine_ops);

CREATE TABLE specialist_session_format (
  specialist_id uuid NOT NULL REFERENCES specialist (id) ON DELETE CASCADE,
  session_format_id uuid NOT NULL REFERENCES session_format (id),
  PRIMARY KEY (specialist_id, session_format_id)
);
CREATE INDEX specialist_session_format_session_format_id_idx ON specialist_session_format (session_format_id);

CREATE TABLE specialist_areas_practice (
  specialist_id uuid NOT NULL REFERENCES specialist (id) ON DELETE CASCADE,
  areas_practice_id uuid NOT NULL REFERENCES areas_practice (id),
  PRIMARY KEY (specialist_id, areas_practice_id)
);
CREATE INDEX specialist_areas_practice_areas_practice_id_idx ON specialist_areas_practice (areas_practice_id);

CREATE TABLE specialist_credentials (
  specialist_id uuid NOT NULL REFERENCES specialist (id) ON DELETE CASCADE,
  credentials_id uuid NOT NULL REFERENCES credentials (id),
  PRIMARY KEY (specialist_id, credentials_id)
);
CREATE INDEX specialist_credentials_credentials_id_idx ON specialist_credentials (credentials_id);

-- Down Migration
DROP TABLE specialist_credentials;
DROP TABLE specialist_areas_practice;
DROP TABLE specialist_session_format;
DROP TABLE specialist;
DROP TABLE credentials;
DROP TABLE areas_practice;
DROP TABLE session_format;
DROP TABLE role;
