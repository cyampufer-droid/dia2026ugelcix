-- PostgreSQL schema for institutions, users, students, evaluations, responses, and consolidated results

-- Enabling Row Level Security for all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE consolidated_results ENABLE ROW LEVEL SECURITY;

-- Institutions Table
CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    institution_id INTEGER REFERENCES institutions(id),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evaluations Table
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Responses Table
CREATE TABLE responses (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consolidated Results Table
CREATE TABLE consolidated_results (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
    overall_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_responses_student_id ON responses(student_id);

-- Row Level Security Policies
CREATE POLICY select_institutions ON institutions FOR SELECT USING (true);
CREATE POLICY insert_institutions ON institutions FOR INSERT USING (true);
CREATE POLICY select_users ON users FOR SELECT USING (current_user = email);
CREATE POLICY select_students ON students FOR SELECT USING (user_id = (SELECT id FROM users WHERE email = current_user));
CREATE POLICY select_responses ON responses FOR SELECT USING (student_id = (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = current_user)));
CREATE POLICY select_consolidated_results ON consolidated_results FOR SELECT USING (evaluation_id IN (SELECT id FROM evaluations WHERE EXISTS (SELECT 1 FROM responses WHERE student_id = (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = current_user)))));

