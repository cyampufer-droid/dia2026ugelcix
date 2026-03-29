-- File: supabase/migrations/20260329_init_schema.sql

-- Enable Row Level Security
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE consolidated_results ENABLE ROW LEVEL SECURITY;

-- Create institutions table
CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for institutions
CREATE INDEX idx_institutions_name ON institutions(name);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for users
CREATE INDEX idx_users_username ON users(username);

-- Create students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    institution_id INTEGER REFERENCES institutions(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for students
CREATE INDEX idx_students_last_name ON students(last_name);

-- Create evaluations table
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for evaluations
CREATE INDEX idx_evaluations_title ON evaluations(title);

-- Create evaluation_responses table
CREATE TABLE evaluation_responses (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id),
    student_id INTEGER REFERENCES students(id),
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for evaluation_responses
CREATE INDEX idx_evaluation_responses_evaluation_id ON evaluation_responses(evaluation_id);

-- Create consolidated_results table
CREATE TABLE consolidated_results (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id),
    student_id INTEGER REFERENCES students(id),
    score NUMERIC CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for consolidated_results
CREATE INDEX idx_consolidated_results_evaluation_id ON consolidated_results(evaluation_id);

-- RLS Policies
CREATE POLICY select_institutions ON institutions FOR SELECT USING (true);
CREATE POLICY select_users ON users FOR SELECT USING (true);
CREATE POLICY select_students ON students FOR SELECT USING (user_id = current_setting('my.username'));
CREATE POLICY select_evaluations ON evaluations FOR SELECT USING (institution_id IN (SELECT id FROM institutions WHERE user_id = current_setting('my.username')));
CREATE POLICY select_evaluation_responses ON evaluation_responses FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = current_setting('my.username')));
CREATE POLICY select_consolidated_results ON consolidated_results FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = current_setting('my.username')));

-- Enable policies
ALTER TABLE institutions FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;
ALTER TABLE evaluations FORCE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses FORCE ROW LEVEL SECURITY;
ALTER TABLE consolidated_results FORCE ROW LEVEL SECURITY;