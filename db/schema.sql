-- Enable foreign keys
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL,
    district TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    district TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS university_profiles (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    description TEXT,
    innovation_capacity TEXT,
    incubator_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (university_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS expertise (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT
);

CREATE TABLE IF NOT EXISTS university_expertise (
    university_id TEXT NOT NULL,
    expertise_id TEXT NOT NULL,
    strength_score INTEGER,
    PRIMARY KEY (university_id, expertise_id),
    FOREIGN KEY (university_id) REFERENCES organizations(id),
    FOREIGN KEY (expertise_id) REFERENCES expertise(id)
);

CREATE TABLE IF NOT EXISTS faculty_profiles (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    university_id TEXT NOT NULL,
    designation TEXT,
    bio TEXT,
    FOREIGN KEY (profile_id) REFERENCES profiles(id),
    FOREIGN KEY (university_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS faculty_expertise (
    faculty_id TEXT NOT NULL,
    expertise_id TEXT NOT NULL,
    PRIMARY KEY (faculty_id, expertise_id),
    FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(id),
    FOREIGN KEY (expertise_id) REFERENCES expertise(id)
);

CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    problem_code TEXT UNIQUE NOT NULL,
    submitted_by TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    district TEXT,
    block TEXT,
    village TEXT,
    latitude REAL,
    longitude REAL,
    citizen_priority TEXT,
    affected_population_estimate INTEGER,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submitted_by) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS problem_media (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id)
);

CREATE TABLE IF NOT EXISTS problem_ai_analysis (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    primary_category TEXT,
    secondary_categories TEXT, -- JSON array
    summary TEXT,
    problem_type TEXT,
    priority TEXT,
    required_skills TEXT, -- JSON array
    keywords TEXT, -- JSON array
    confidence REAL,
    raw_response TEXT, -- JSON object
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id)
);

CREATE TABLE IF NOT EXISTS problem_similarity (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    similar_problem_id TEXT NOT NULL,
    similarity_score REAL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (similar_problem_id) REFERENCES problems(id)
);

CREATE TABLE IF NOT EXISTS university_matches (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    university_id TEXT NOT NULL,
    match_score REAL,
    matching_reasons TEXT, -- JSON object
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (university_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS external_problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'OPEN',
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    assigned_university_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    status TEXT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (assigned_university_id) REFERENCES organizations(id),
    FOREIGN KEY (assigned_by) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    lead_university_id TEXT NOT NULL,
    challenge_id TEXT,
    name TEXT,
    description TEXT,
    status TEXT NOT NULL,
    start_date DATETIME,
    target_date DATETIME,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (lead_university_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    role TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS project_partners (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS user_organizations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    problem_understanding TEXT,
    solution TEXT,
    innovation TEXT,
    technical_approach TEXT,
    budget REAL,
    timeline TEXT,
    risks TEXT,
    expected_impact TEXT,
    status TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (submitted_by) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT,
    due_date DATETIME,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (owner_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS milestone_evidence (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    description TEXT,
    uploaded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id),
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS partnership_requests (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    industry_id TEXT NOT NULL,
    support_type TEXT NOT NULL,
    description TEXT,
    estimated_value REAL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (industry_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS impact_metrics (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    unit TEXT,
    baseline_value REAL,
    target_value REAL,
    verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    problem_id TEXT,
    user_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT, -- JSON
    new_value TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    email_enabled BOOLEAN DEFAULT 1,
    new_challenge_enabled BOOLEAN DEFAULT 1,
    challenge_assigned_enabled BOOLEAN DEFAULT 1,
    project_update_enabled BOOLEAN DEFAULT 1,
    deadline_enabled BOOLEAN DEFAULT 1,
    partnership_enabled BOOLEAN DEFAULT 1,
    frequency TEXT DEFAULT 'INSTANT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS email_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subscription_type TEXT NOT NULL,
    categories TEXT, -- JSON
    skills TEXT, -- JSON
    districts TEXT, -- JSON
    minimum_priority TEXT,
    enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at DATETIME,
    provider_message_id TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);
