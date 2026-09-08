# Jharkhand Societal Innovation Collaboration Portal

## MVP System Architecture & Antigravity Build Specification

**Document purpose:** This file is a build-ready specification for
Antigravity.\
**Scope:** MVP only --- focus on a working end-to-end workflow rather
than every feature described in the original problem statement.\
**Revision note:** This version (a) replaces the cloud-only Supabase
data layer with a local, spreadsheet-editable dataset (Section 52),
(b) mandates the Government of India **UX4G** design system for all UI
(Section 53), and (c) replaces the Next.js/React/TypeScript stack with
**plain HTML, CSS, and JavaScript** on a small Node.js/Express backend
for simplicity (Section 3). See Section 55 for the things to set up
before any feature work begins.

------------------------------------------------------------------------

# 1. Product Vision

Build a web platform that turns community problems into structured
innovation projects.

### Core flow

Citizen submits problem → AI analyzes it → system detects possible
duplicates → problem is validated → suitable university is recommended →
university accepts it → university creates student/faculty team →
industry partner can offer funding/mentorship/resources → project
milestones are tracked → government/admin dashboard shows progress and
impact.

The MVP must make this complete flow demonstrable with realistic sample
data.

------------------------------------------------------------------------

# 2. MVP Goals

## Must have

1.  Citizen registration/login.
2.  Citizen problem submission.
3.  Photo upload.
4.  Location capture/manual location entry.
5.  Problem status tracking.
6.  Admin problem review and validation.
7.  AI-assisted:
    -   category classification
    -   priority estimation
    -   required skills extraction
    -   duplicate/similar-problem detection
    -   university recommendation
8.  University dashboard.
9.  University challenge acceptance.
10. Student/faculty team creation.
11. Solution proposal submission.
12. Industry/startup dashboard.
13. Industry offer of support:

-   mentorship
-   funding
-   technology/resources

14. Project milestone tracking.
15. Admin/government analytics dashboard.
16. Notifications inside the platform.
17. Role-based access control.
18. Audit trail for important status changes.

## Do NOT build in MVP

-   Native Android/iOS applications.
-   Blockchain.
-   Complex payment gateway.
-   Full government SSO.
-   Automatic legal/IP filing.
-   Live IoT integrations.
-   Advanced GIS analysis.
-   Production-scale recommendation model training.
-   WhatsApp API unless time permits.
-   Complex procurement workflows.

------------------------------------------------------------------------

# 3. Recommended Technology Stack

Keep the stack simple and production-capable. **Revised per request:
no frontend framework, no build step, no TypeScript.** Everything is
plain HTML, CSS, and JavaScript, served by a small Node.js backend.

## Frontend --- plain HTML, CSS, JavaScript

-   **Multi-page app**: every screen is its own `.html` file (or an
    EJS template that renders to plain HTML on the server --- see
    "Avoiding copy-pasted headers" below). No React, no Vue, no
    Angular, no bundler, no build step. Open the app, view source, and
    it's just HTML.
-   **UX4G Design System 3.0** (Government of India / MeitY-NeGD)
    loaded via **CDN `<link>`/`<script>` tags** --- UX4G officially
    supports plain HTML integration this way, no npm/build tooling
    required. Get the CDN snippet from
    `https://doc.ux4g.gov.in/web`. Use it for all standard UI: forms,
    buttons, inputs, tables, navigation, cards, status badges, OTP
    input, stepper, modals. Use the official CSS variables for colors
    and spacing rather than inventing a custom palette.
-   Plain CSS for anything UX4G doesn't cover, in one shared
    `public/css/app.css` file. No Tailwind, no CSS-in-JS.
-   Plain JavaScript files (`public/js/*.js`, loaded with `<script>`
    tags, no imports/bundler) that:
    -   call the backend with `fetch()` and render results into the
        DOM with plain `document.createElement`/`innerHTML`
        (sanitize anything containing user input before inserting)
    -   handle form submission, client-side validation hints (HTML5
        `required`/`pattern` attributes plus a small JS check),
        loading/error states
-   Chart.js via CDN for the analytics dashboard (Section 26) --- UX4G
    ships with built-in Chart.js styling support, so charts match the
    rest of the UI automatically.
-   Leaflet + OpenStreetMap via CDN for the map (Section 26) and the
    citizen location picker (Section 7).

### Avoiding copy-pasted headers/footers (optional but recommended)

Copy-pasting the government header/footer (Section 53) into every
`.html` file works but is easy to get out of sync. The simplest fix
that doesn't add a frontend framework: use **EJS** on the server just
to render shared partials (`views/partials/header.ejs`,
`views/partials/footer.ejs`) into otherwise plain HTML pages. EJS
output *is* plain HTML by the time it reaches the browser --- there is
no client-side framework, no virtual DOM, nothing to learn beyond
writing HTML with a couple of `<%- include(...) %>` lines. If even
that feels like too much, skip EJS and copy-paste the header/footer
markup into each `.html` file instead; both are valid, EJS just saves
repeated edits later.

## Backend --- plain Node.js + Express

-   **Node.js with Express**, written in plain JavaScript (no
    TypeScript, no compiling --- run `node server.js` and it works).
-   Organize routes with Express Routers, one file per domain
    (`routes/problems.js`, `routes/challenges.js`,
    `routes/projects.js`, `routes/industry.js`,
    `routes/analytics.js`, `routes/auth.js`,
    `routes/notifications.js`), matching the API design in Section 21.
-   `multer` for file uploads (photos/videos/documents on problem
    submission).
-   `express-session` + `bcryptjs` for simple session-based login ---
    no external auth provider needed.
-   Avoid creating a separate microservice architecture for the MVP;
    one Express app is enough.

## Database

-   **SQLite, stored as a local file (`data/app.db`), is the default
    for the MVP.** It needs no hosted account, no network dependency,
    and can be opened directly in a desktop SQLite browser if needed.
    This also makes the demo runnable fully offline on a judge's
    laptop.
-   Use **`better-sqlite3`** directly (plain, synchronous, no ORM) ---
    write queries as plain SQL strings in a `server/db/queries.js`
    module per domain. This keeps the stack to "HTML, CSS, JavaScript"
    with nothing extra to learn; the trade-off is that moving to
    Postgres later means rewriting the SQL layer rather than flipping
    an ORM config line, which is an acceptable cost for MVP simplicity.
-   Schema lives in a plain `db/schema.sql` file (the `CREATE TABLE`
    statements from Section 19), applied once at setup with a tiny
    `scripts/migrate.js` that runs the `.sql` file against
    `data/app.db`.
-   File storage: store uploaded files on local disk under
    `storage/` (path saved in `problem_media`, exactly as described in
    Section 23).
-   No Row Level Security (SQLite doesn't have it): authorization is
    enforced entirely in Express middleware (see Section 22 --- API
    Security) --- a shared `authorize(role, resourceCheck)` middleware
    function used on every protected route.

See **Section 52 --- Local, Excel/CSV-Editable Dataset Management**
for how to keep reference data (universities, departments, expertise,
categories, districts, seed problems) easy for a non-developer to
maintain.

## AI

Use an LLM API through a plain server-side JavaScript module
(`server/lib/ai/*.js`) --- the browser never calls the LLM directly.

AI tasks: - classification - structured extraction - similarity
analysis - university matching explanation

Validate the AI's JSON response with **Zod** (Section 8) --- Zod is a
plain JavaScript library, no TypeScript required, and it's worth
keeping specifically because it's the safety net between an
unreliable LLM response and your database.

Do not expose the AI API key to the browser.

## Deployment

-   Any plain Node.js host works (Render, Railway, a small VPS, or
    even a laptop for the demo) since there's no framework-specific
    build step --- deployment is "copy the files, run `npm install`,
    run `node server.js`."
-   `data/app.db` and `storage/` need to live on persistent disk
    wherever it's deployed (a serverless platform that wipes disk
    between requests, like a default Vercel function, will not work
    for this stack --- pick a host that keeps a normal always-on
    process and filesystem).

------------------------------------------------------------------------

# 4. High-Level Architecture

``` text
                         ┌─────────────────────┐
                         │      CITIZEN        │
                         │ Submit / Track      │
                         └──────────┬──────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│         PLAIN HTML / CSS / JS PAGES (served by Express)      │
│                                                              │
│  Citizen Portal     University Portal     Industry Portal   │
│  Admin/Gov Dashboard        Project Workspace                │
│           (UX4G components, fetch() calls to the API)        │
└───────────────────────────────┬──────────────────────────────┘
                                │  fetch() JSON calls
                                ▼
┌──────────────────────────────────────────────────────────────┐
│              NODE.JS + EXPRESS APPLICATION (server.js)       │
└───────────────────────────────┬──────────────────────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
        ┌───────────┐     ┌────────────┐     ┌─────────────┐
        │  SQLite   │     │ AI Service │     │ Local Disk  │
        │ (app.db)  │     │ / LLM API  │     │  Storage    │
        └───────────┘     └────────────┘     └─────────────┘
              │                 │
              │                 ▼
              │          Classification
              │          Priority
              │          Skills

              │          Similarity
              │          Matching
              │
              ▼
        ┌─────────────────────────────────┐
        │ University / Industry / Project │
        │ Data + Workflow + Audit Logs    │
        └─────────────────────────────────┘
```

------------------------------------------------------------------------

# 5. User Roles

Implement these roles:

## CITIZEN

Can: - create account - submit problems - upload evidence - view own
submissions - comment on own problems - track status

Cannot: - see private university/industry information - change AI
results - approve projects

## UNIVERSITY_ADMIN

Can: - view assigned/recommended challenges - accept/reject challenges -
manage university profile - create teams - assign faculty - manage
projects

## FACULTY

Can: - join/manage project teams - mentor students - update milestones -
submit proposals - upload project documents

## STUDENT

Can: - join assigned projects - update assigned tasks - upload project
evidence - participate in project workspace

## INDUSTRY_PARTNER

Can: - browse approved challenges/projects - express interest - offer
funding/resources/mentorship - manage partnership commitments

## GOVERNMENT_ADMIN

Can: - view all validated problems - approve/assign challenges - monitor
projects - view analytics - manage districts/categories

## SUPER_ADMIN

Can: - manage users - manage roles - manage universities - manage
industry organizations - manage categories - moderate content - access
audit logs - configure platform settings

------------------------------------------------------------------------

# 6. Main Screens

## Public

-   Landing page
-   About
-   How it works
-   Browse public challenges
-   Login
-   Register

## Citizen

-   Citizen dashboard
-   Submit problem
-   My problems
-   Problem detail
-   Notifications
-   Profile

## University

-   University dashboard
-   Recommended challenges
-   Assigned challenges
-   Projects
-   Teams
-   Faculty
-   University profile
-   Notifications

## Industry

-   Industry dashboard
-   Discover projects
-   Project detail
-   Partnership requests
-   My partnerships
-   Notifications
-   Organization profile

## Government/Admin

-   Overview dashboard
-   Problem management
-   Problem detail
-   University management
-   Industry management
-   Project monitoring
-   Analytics
-   User management
-   Audit logs

------------------------------------------------------------------------

# 7. Problem Submission Flow

## Citizen UI

Form fields:

-   title
-   description
-   category (optional because AI can suggest it)
-   district
-   block/locality/village
-   latitude
-   longitude
-   urgency selected by citizen
-   affected people estimate
-   photo(s)
-   video (optional)
-   document (optional)

After submission:

``` text
SUBMITTED
   ↓
AI ANALYSIS
   ↓
PENDING VALIDATION
```

Generate a human-readable problem ID such as:

`JH-2026-000001`

------------------------------------------------------------------------

# 8. AI Problem Analysis

When a problem is submitted, create an AI analysis job.

## Input

``` json
{
  "title": "...",
  "description": "...",
  "district": "...",
  "location": "...",
  "citizen_priority": "high"
}
```

## Expected AI output

``` json
{
  "primary_category": "Water Management",
  "secondary_categories": ["Agriculture"],
  "summary": "Short normalized problem statement",
  "problem_type": "Irrigation",
  "priority": "HIGH",
  "required_skills": [
    "Agricultural Engineering",
    "IoT",
    "Water Management",
    "Electronics"
  ],
  "keywords": [
    "irrigation",
    "water",
    "farm",
    "sensor"
  ],
  "affected_population_estimate": 100,
  "confidence": 0.91
}
```

The backend must validate the returned JSON using Zod before saving it.

------------------------------------------------------------------------

# 9. AI Duplicate Detection

Do not automatically delete or merge problems.

Instead:

``` text
New Problem
    ↓
Find similar problems
    ↓
Similarity score
    ↓
If score >= threshold
    ↓
Flag as POSSIBLE DUPLICATE
```

Example:

``` text
Problem #JH-1024
Possible duplicate:
Problem #JH-0981

Similarity: 89%
```

Admin decides:

-   merge
-   keep separate
-   mark unrelated

For MVP, similarity can initially use normalized text + embeddings or an
LLM-assisted comparison. Keep the implementation behind an interface so
the method can be upgraded later.

------------------------------------------------------------------------

# 10. University Matching Engine

Every university needs an expertise profile.

Store:

``` text
University
 ├── departments
 ├── faculty expertise
 ├── research areas
 ├── labs
 ├── innovation capabilities
 ├── incubation capabilities
 └── supported domains
```

For each problem:

``` text
Problem
 ↓
Required skills
 ↓
University expertise
 ↓
Match score
```

Example:

``` text
1. BIT X        92%
2. University Y 87%
3. University Z 78%
```

The system should also explain the score:

``` text
92% match because:
- Agriculture department
- IoT research group
- Irrigation research
- Relevant faculty expertise
```

Do not present AI matching as a final decision. Present it as a
recommendation for an admin/university to accept.

------------------------------------------------------------------------

# 11. Problem Lifecycle

Use these statuses:

``` text
DRAFT
SUBMITTED
AI_ANALYZING
PENDING_VALIDATION
VALIDATED
REJECTED
POSSIBLE_DUPLICATE
MATCHING
ASSIGNED
ACCEPTED_BY_UNIVERSITY
TEAM_FORMED
PROPOSAL_SUBMITTED
UNDER_REVIEW
APPROVED
IN_DEVELOPMENT
PILOT_TESTING
DEPLOYED
RESOLVED
CLOSED
```

Every transition should be recorded in an audit/event table.

------------------------------------------------------------------------

# 12. University Workflow

University receives:

``` text
New Recommended Challenge
```

University can:

-   view problem
-   see AI analysis
-   see required skills
-   see recommended match score
-   accept
-   reject with reason

After acceptance:

``` text
Challenge
   ↓
Create Project
   ↓
Create Team
   ↓
Assign Faculty Mentor
   ↓
Submit Solution Proposal
```

------------------------------------------------------------------------

# 13. Team Structure

A project team contains:

-   project lead
-   faculty mentor
-   students
-   optional external mentor

Example:

``` text
PROJECT
Smart Irrigation

Faculty Mentor
Dr. Sharma

Students
- Electronics
- Computer Science
- Agriculture

External Mentor
IoT Startup
```

------------------------------------------------------------------------

# 14. Solution Proposal

University submits:

-   proposed solution title
-   problem understanding
-   proposed approach
-   innovation
-   technical architecture
-   expected outcome
-   estimated budget
-   timeline
-   required resources
-   risks
-   expected community impact

Admin can:

-   approve
-   request changes
-   reject

------------------------------------------------------------------------

# 15. Industry Partnership Workflow

Industry sees approved/public projects.

Buttons:

``` text
INTERESTED
OFFER MENTORSHIP
OFFER FUNDING
OFFER EQUIPMENT
OFFER TECHNOLOGY
OFFER PILOT SUPPORT
```

Create a partnership request.

Example:

``` text
Startup ABC

Support type:
IoT Hardware

Amount/value:
₹1,00,000

Message:
"We can provide sensors and technical mentorship."
```

University/admin accepts or rejects the offer.

------------------------------------------------------------------------

# 16. Project Management

Each project contains:

## Milestones

Example:

``` text
M1 Problem research        COMPLETE
M2 System design           COMPLETE
M3 Prototype               IN PROGRESS
M4 Field testing           NOT STARTED
M5 Deployment              NOT STARTED
```

Each milestone has:

-   title
-   description
-   owner
-   due date
-   status
-   deliverables
-   evidence
-   comments

------------------------------------------------------------------------

# 17. Impact Measurement

For MVP allow projects to define measurable indicators.

Examples:

``` text
Farmers benefited: 86
Water saved: 31%
Cost reduction: 24%
Students involved: 8
Prototype cost: ₹45,000
```

Store these as flexible impact metrics.

Do not hard-code only agricultural metrics.

------------------------------------------------------------------------

# 18. Notification System

Start with in-app notifications.

Examples:

``` text
Your problem has been validated.

Your challenge has been assigned to University X.

University X accepted your challenge.

A new industry partner has shown interest.

Milestone M3 is due tomorrow.
```

Create notification records in the database.

Email can be added after the MVP works.

------------------------------------------------------------------------

# 19. Database Schema

Use PostgreSQL.

## profiles

``` text
id UUID PK
full_name
phone
avatar_url
role
district
created_at
updated_at
```

## organizations

``` text
id UUID PK
name
type
description
website
logo_url
district
created_at
```

Organization types:

``` text
UNIVERSITY
INDUSTRY
STARTUP
MSME
CSR
RESEARCH_LAB
GOVERNMENT
NGO
```

## university_profiles

``` text
id UUID PK
organization_id FK
description
innovation_capacity
incubator_info
created_at
```

## departments

``` text
id UUID PK
university_id FK
name
description
```

## expertise

``` text
id UUID PK
name
category
```

## university_expertise

``` text
university_id FK
expertise_id FK
strength_score
```

## faculty_profiles

``` text
id UUID PK
profile_id FK
university_id FK
designation
bio
```

## faculty_expertise

``` text
faculty_id FK
expertise_id FK
```

## problems

``` text
id UUID PK
problem_code UNIQUE
submitted_by FK
title
description
district
block
village
latitude
longitude
citizen_priority
status
created_at
updated_at
```

## problem_media

``` text
id UUID PK
problem_id FK
type
storage_path
mime_type
created_at
```

## problem_ai_analysis

``` text
id UUID PK
problem_id FK
primary_category
secondary_categories JSONB
summary
problem_type
priority
required_skills JSONB
keywords JSONB
confidence
raw_response JSONB
created_at
```

## problem_similarity

``` text
id UUID PK
problem_id FK
similar_problem_id FK
similarity_score
status
created_at
```

## university_matches

``` text
id UUID PK
problem_id FK
university_id FK
match_score
matching_reasons JSONB
status
created_at
```

## challenges

``` text
id UUID PK
problem_id FK
assigned_university_id FK
assigned_by FK
status
assigned_at
accepted_at
```

## projects

``` text
id UUID PK
challenge_id FK
name
description
status
start_date
target_date
created_by FK
created_at
updated_at
```

## project_members

``` text
id UUID PK
project_id FK
profile_id FK
role
joined_at
```

## proposals

``` text
id UUID PK
project_id FK
title
problem_understanding
solution
innovation
technical_approach
budget
timeline
risks
expected_impact
status
submitted_by FK
created_at
updated_at
```

## milestones

``` text
id UUID PK
project_id FK
title
description
owner_id FK
due_date
status
created_at
updated_at
```

## milestone_evidence

``` text
id UUID PK
milestone_id FK
storage_path
description
uploaded_by FK
created_at
```

## partnership_requests

``` text
id UUID PK
project_id FK
industry_id FK
support_type
description
estimated_value
status
created_at
updated_at
```

## impact_metrics

``` text
id UUID PK
project_id FK
metric_name
metric_value
unit
baseline_value
target_value
verified
created_at
```

## comments

``` text
id UUID PK
project_id FK nullable
problem_id FK nullable
user_id FK
body
created_at
```

## notifications

``` text
id UUID PK
user_id FK
title
message
type
read_at
created_at
```

## audit_logs

``` text
id UUID PK
actor_id FK
entity_type
entity_id
action
old_value JSONB
new_value JSONB
created_at
```

------------------------------------------------------------------------

# 20. Database Relationships

``` text
PROFILE
  │
  ├──────── submits ────────> PROBLEM
  │                             │
  │                             ├── MEDIA
  │                             ├── AI ANALYSIS
  │                             ├── SIMILARITY
  │                             └── UNIVERSITY MATCH
  │                                      │
  │                                      ▼
  │                                  CHALLENGE
  │                                      │
  │                                      ▼
  │                                   PROJECT
  │                                      │
  │                    ┌─────────────────┼────────────────┐
  │                    ▼                 ▼                ▼
  │                  TEAM            MILESTONES      PROPOSAL
  │                    │                                  │
  │                    └──────────────────────────────────┘
  │
  └──────────────> NOTIFICATIONS / COMMENTS / AUDIT LOGS

PROJECT
  │
  ├── PARTNERSHIP REQUESTS ──> INDUSTRY
  │
  └── IMPACT METRICS
```

------------------------------------------------------------------------

# 21. API Design

Use REST-style JSON endpoints via Express Routers (plain JavaScript,
one router file per domain, mounted in `server.js`).

## Auth

``` text
POST /api/auth/profile
GET  /api/auth/me
```

Supabase Auth handles login/signup.

## Problems

``` text
POST /api/problems
GET  /api/problems
GET  /api/problems/:id
PATCH /api/problems/:id
POST /api/problems/:id/validate
POST /api/problems/:id/analyze
POST /api/problems/:id/check-duplicates
```

## Matching

``` text
POST /api/problems/:id/match-universities
GET  /api/problems/:id/matches
```

## Challenges

``` text
POST /api/challenges
PATCH /api/challenges/:id
POST /api/challenges/:id/accept
POST /api/challenges/:id/reject
```

## Projects

``` text
POST /api/projects
GET  /api/projects
GET  /api/projects/:id
PATCH /api/projects/:id
```

## Teams

``` text
POST /api/projects/:id/members
DELETE /api/projects/:id/members/:memberId
```

## Proposals

``` text
POST /api/projects/:id/proposal
GET  /api/projects/:id/proposal
PATCH /api/projects/:id/proposal
POST /api/projects/:id/proposal/review
```

## Milestones

``` text
POST /api/projects/:id/milestones
PATCH /api/milestones/:id
POST /api/milestones/:id/evidence
```

## Industry

``` text
GET  /api/industry/projects
POST /api/partnerships
PATCH /api/partnerships/:id
```

## Analytics

``` text
GET /api/analytics/overview
GET /api/analytics/problems
GET /api/analytics/projects
GET /api/analytics/impact
```

------------------------------------------------------------------------

# 22. API Security

Never trust role information from the frontend.

Every protected API request must verify:

1.  authenticated user
2.  user role
3.  resource ownership/access
4.  organization membership

Example:

``` text
Citizen A cannot edit Citizen B's problem.

University A cannot modify University B's project.

Industry A cannot view private partnership information
unless access has been granted.
```

Use Supabase Row Level Security where practical.

------------------------------------------------------------------------

# 23. Storage

Use Supabase Storage buckets.

Recommended:

``` text
problem-media
project-evidence
proposal-documents
avatars
organization-assets
```

Never store large image/video binary data directly in PostgreSQL.

Store the file in storage and save its path in `problem_media`.

------------------------------------------------------------------------

# 24. AI Architecture

Create a provider-independent AI service.

``` text
lib/ai/
 ├── analyzer.js
 ├── classifier.js
 ├── duplicate-detector.js
 ├── university-matcher.js
 └── schemas.js       (Zod schemas, plain JavaScript)
```

The UI should never directly call the LLM.

Flow:

``` text
Browser
  ↓
Server API
  ↓
AI service
  ↓
LLM provider
  ↓
Validated JSON
  ↓
PostgreSQL
```

Use structured output whenever the provider supports it.

If AI fails:

``` text
AI_FAILED
```

Do not block the citizen from submitting the problem.

Admin can manually classify it.

------------------------------------------------------------------------

# 25. University Matching Algorithm --- MVP

Use a simple explainable weighted score.

Example:

``` text
Skill match             50%
Domain match            20%
Faculty expertise       15%
Research/lab capability 10%
Geographic proximity     5%
```

Formula:

``` text
match_score =
  skill_match * 0.50 +
  domain_match * 0.20 +
  faculty_match * 0.15 +
  lab_match * 0.10 +
  proximity * 0.05
```

Normalize to 0--100.

This is intentionally simple and explainable.

Later versions can use embeddings/ML ranking.

------------------------------------------------------------------------

# 26. Admin Dashboard KPIs

Top cards:

``` text
Total Problems
Validated
Active Projects
Resolved Problems
Universities Participating
Industry Partners
Students Involved
Community Members Benefited
```

Charts:

1.  Problems by domain
2.  Problems by district
3.  Problems by status
4.  University participation
5.  Industry participation
6.  Project completion rate
7.  Impact metrics
8.  Monthly submission trend

Map:

``` text
Jharkhand
  ↓
District markers
  ↓
Problem density
```

For MVP, use simple district/location markers rather than sophisticated
heatmaps.

------------------------------------------------------------------------

# 27. UI/UX Requirements

The interface should feel like a modern civic-tech product.

Design principles:

-   clean
-   accessible
-   mobile responsive
-   low cognitive load
-   Hindi/English-ready
-   large clear actions
-   status badges
-   timeline-based project tracking
-   visual dashboards

Primary citizen CTA:

``` text
+ REPORT A PROBLEM
```

Problem detail should show:

``` text
Problem
Location
Evidence
AI classification
Current status
Assigned institution
Project progress
Impact
```

------------------------------------------------------------------------

# 28. Accessibility

Implement:

-   keyboard navigation
-   semantic HTML
-   sufficient contrast
-   form validation messages
-   alt text for uploaded images where applicable
-   responsive mobile layout
-   clear error states

------------------------------------------------------------------------

# 29. Seed Data

The MVP must include demo data so the entire workflow can be shown
immediately.

Create:

### Users

-   1 citizen
-   1 government admin
-   1 super admin
-   1 university admin
-   2 faculty
-   4 students
-   2 industry partners

### Universities

At least 3 demo universities with different expertise.

### Problems

At least 10 realistic Jharkhand-style problems:

-   drinking water
-   irrigation
-   school electricity
-   waste management
-   healthcare access
-   road safety
-   sanitation
-   rural livelihood
-   accessibility
-   air/environment monitoring

### Projects

At least 3 projects in different stages.

------------------------------------------------------------------------

# 30. Demo Scenario

The application must support this exact demo:

## Step 1

Login as Citizen.

Submit:

``` text
Title:
Affordable smart irrigation for small farmers

Description:
Farmers in a rural area are struggling with inefficient irrigation
and limited water availability.
```

Attach an image and location.

## Step 2

AI analyzes:

``` text
Agriculture + Water
Priority: High
Skills: IoT, Agriculture, Electronics
```

## Step 3

Admin validates the problem.

## Step 4

System recommends universities.

Example:

``` text
University A — 92%
University B — 84%
University C — 71%
```

## Step 5

Login as University Admin.

Accept challenge.

Create:

``` text
Faculty mentor
+
Agriculture student
+
Electronics student
+
CS student
```

## Step 6

Submit solution proposal.

## Step 7

Login as Industry Partner.

Offer:

``` text
IoT sensors + mentorship
```

## Step 8

Admin accepts partnership.

## Step 9

University updates milestones.

## Step 10

Government dashboard changes:

``` text
Active Projects: +1
Industry Partnerships: +1
```

The whole workflow must be visible without manually editing the
database.

------------------------------------------------------------------------

# 31. Recommended Folder Structure

``` text
jh-societal-innovation/
│
├── public/                       (everything the browser loads directly)
│   ├── index.html
│   ├── citizen/
│   │   ├── dashboard.html
│   │   ├── submit-problem.html
│   │   ├── my-problems.html
│   │   └── problem-detail.html
│   ├── university/
│   │   ├── dashboard.html
│   │   ├── challenges.html
│   │   └── project.html
│   ├── industry/
│   │   ├── dashboard.html
│   │   └── project-detail.html
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── problems.html
│   │   ├── analytics.html
│   │   └── reference-data-import.html
│   ├── css/
│   │   └── app.css               (plain CSS, on top of UX4G CDN styles)
│   ├── js/
│   │   ├── api.js                (shared fetch() wrapper)
│   │   ├── citizen-submit.js
│   │   ├── admin-dashboard.js
│   │   ├── university-dashboard.js
│   │   ├── industry-dashboard.js
│   │   └── charts.js             (Chart.js setup, uses UX4G tokens)
│   └── ux4g/                     (UX4G static assets: emblem, icons, fonts)
│
├── views/partials/                (optional --- only if using EJS, Section 3)
│   ├── header.ejs
│   └── footer.ejs
│
├── server/
│   ├── server.js                  (Express app entry point)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── problems.js
│   │   ├── challenges.js
│   │   ├── projects.js
│   │   ├── industry.js
│   │   ├── analytics.js
│   │   ├── notifications.js
│   │   └── admin.js               (reference-data import/export, Section 52)
│   ├── middleware/
│   │   ├── authenticate.js
│   │   └── authorize.js
│   ├── db/
│   │   ├── connection.js          (better-sqlite3 setup)
│   │   ├── problems.queries.js
│   │   ├── projects.queries.js
│   │   └── ...                    (one queries file per domain)
│   └── lib/
│       ├── ai/
│       │   ├── analyzer.js
│       │   ├── classifier.js
│       │   ├── duplicate-detector.js
│       │   ├── university-matcher.js
│       │   └── schemas.js         (Zod schemas, plain JavaScript)
│       ├── matching/
│       ├── notifications/
│       │   ├── matcher.js
│       │   ├── preferences.js
│       │   ├── email.js
│       │   ├── templates.js
│       │   └── queue.js
│       └── validation.js
│
├── db/
│   └── schema.sql                 (plain CREATE TABLE statements, Section 19)
│
├── data/
│   ├── app.db                     (local SQLite file, git-ignored)
│   └── seed/                      (EDITABLE reference-data spreadsheets)
│       ├── universities.xlsx
│       ├── departments.xlsx
│       ├── expertise.xlsx
│       ├── categories.xlsx
│       ├── districts.xlsx
│       └── demo-problems.xlsx
│
├── scripts/
│   ├── migrate.js                 (applies db/schema.sql to data/app.db)
│   └── seed-from-excel.js         (reads /data/seed/*.xlsx → upserts into DB)
│
├── storage/                       (uploaded photos/videos/documents, git-ignored)
│
├── .env.example
├── README.md
└── package.json
```

There is no `app/` router, no `components/`, no `types/`, no build
config, and no `.tsx`/`.jsx` files anywhere --- every file the browser
sees is a real `.html`, `.css`, or `.js` file, and every file the
server runs is plain `.js`.

------------------------------------------------------------------------

# 32. Environment Variables

Create `.env.example` (loaded with the `dotenv` package in plain
JavaScript, no framework-specific env conventions):

``` text
# Server
PORT=3000
SESSION_SECRET=

# Local SQLite database file (default for MVP)
DATABASE_FILE=./data/app.db

# AI
AI_API_KEY=
AI_MODEL=
```

Never commit real secrets. `data/app.db` and everything under
`storage/` should be git-ignored except the editable seed spreadsheets
described in Section 52.

------------------------------------------------------------------------

# 33. Important Engineering Rules

1.  Plain JavaScript throughout (frontend and backend) --- no
    TypeScript, no build/compile step.
2.  No hard-coded API keys; load them with `dotenv` from `.env`.
3.  Validate every API request body with Zod on the server (plain
    JavaScript, no type annotations needed) --- client-side HTML5
    validation is a UX nicety, never the actual security boundary.
4.  Validate AI output before database insertion.
5.  Use SQLite transactions (`db.transaction(...)` in
    `better-sqlite3`) for multi-step critical operations.
6.  Use loading/error/empty states on every dashboard, done in plain
    JS by toggling a CSS class or swapping DOM content --- no framework
    state management needed.
7.  Do not expose private records through client-side filtering
    alone; the server must never send data the requester isn't allowed
    to see in the first place.
8.  Use server-side authorization (Express middleware, Section 22).
9.  Keep AI provider code isolated in `server/lib/ai/`.
10. Keep shared HTML markup (a card, a status badge, a table row) as a
    small JS function that returns an HTML string or DOM node, reused
    across pages that need it, instead of copy-pasting markup
    everywhere.
11. Avoid premature microservices; one Express app is enough.
12. Keep the application runnable after every major feature: at any
    point, `npm install && node server.js` should start a working app.
13. Reference/master data (universities, departments, expertise,
    categories, districts, demo problems) is edited in spreadsheets
    under `data/seed/` and imported via `scripts/seed-from-excel.js`
    (Section 52) --- never hand-write SQL `INSERT`s for this data.
14. Do not build custom buttons, forms, tables, or navigation from
    scratch where a UX4G component already exists (Section 53); custom
    CSS is for gaps in UX4G's coverage, not for restyling it.

------------------------------------------------------------------------

# 34. Build Order for Antigravity

Build in this exact order.

## Phase 1 --- Foundation

-   initialize a plain Node.js + Express project (`npm init`, no
    framework scaffolding tool)
-   add UX4G Design System via CDN `<link>`/`<script>` tags on a base
    HTML template (Section 53)
-   build the government-standard header/footer/accessibility shell as
    plain HTML (optionally an EJS partial, Section 3) and reuse it
    across every page
-   `better-sqlite3` + local SQLite setup (`data/app.db`), schema
    applied from `db/schema.sql` via `scripts/migrate.js`
-   Excel/CSV seed importer (`scripts/seed-from-excel.js`) and the
    editable spreadsheets under `data/seed/` (Section 52)
-   authentication (`express-session` + `bcryptjs`, local database)
-   `authorize()` Express middleware for role/ownership checks
    (replaces DB-level RLS for the MVP)
-   role-based route protection
-   base HTML layout / shared header-footer

## Phase 2 --- Citizen

-   landing page
-   citizen dashboard
-   problem submission
-   file upload
-   location
-   problem detail
-   status tracking

## Phase 3 --- Admin

-   problem list
-   filtering/search
-   problem detail
-   validation
-   status changes
-   user management

## Phase 4 --- AI

-   AI analysis
-   structured classification
-   priority
-   skills extraction
-   duplicate detection
-   matching

## Phase 5 --- University

-   university dashboard
-   challenge discovery
-   challenge acceptance
-   project creation
-   team management
-   proposal

## Phase 6 --- Industry

-   industry dashboard
-   project discovery
-   partnership request
-   support type
-   partnership management

## Phase 7 --- Project Management

-   milestones
-   evidence
-   comments
-   project timeline
-   impact metrics

## Phase 8 --- Government Analytics

-   KPI cards
-   charts
-   district statistics
-   project statistics
-   impact statistics
-   map

## Phase 9 --- Polish

-   notifications
-   audit logs
-   accessibility
-   responsive testing
-   error handling
-   seed/demo data
-   production deployment

------------------------------------------------------------------------

# 35. Definition of Done

The MVP is complete only when a judge can perform this without developer
intervention:

``` text
Citizen
 ↓
Submit problem
 ↓
AI analyzes
 ↓
Admin validates
 ↓
University recommended
 ↓
University accepts
 ↓
Team created
 ↓
Proposal submitted
 ↓
Industry offers support
 ↓
Admin accepts partnership
 ↓
Milestones updated
 ↓
Impact recorded
 ↓
Government dashboard reflects everything
```

If this flow works reliably, the MVP is successful.

------------------------------------------------------------------------

# 36. Future Version Roadmap

After the MVP:

## V2

-   multilingual Hindi + regional language support
-   WhatsApp problem submission
-   mobile/PWA improvements
-   advanced semantic search
-   better duplicate clustering
-   automated university/team recommendation
-   email/SMS notifications
-   public challenge marketplace

## V3

-   government department integrations
-   CSR funding workflow
-   research grant integration
-   patent/IP tracking
-   incubation/startup conversion
-   procurement/deployment workflow
-   advanced GIS
-   impact verification

## V4

-   statewide innovation intelligence platform
-   predictive problem detection
-   district-level innovation planning
-   cross-state challenge sharing
-   national institutional network

------------------------------------------------------------------------

# 37. Antigravity Implementation Instruction

Treat this document as the authoritative MVP product specification.

Do not attempt to build every future feature.

Start by:

1.  Creating the plain Node.js + Express project and base HTML/UX4G
    shell.
2.  Creating the SQLite database schema (`db/schema.sql`) and the
    migration/seed scripts.
3.  Implementing session-based authentication against the local
    database.
4.  Implementing role-based access.
5.  Building the citizen problem submission flow.
6.  Building the admin validation flow.
7.  Building AI analysis.
8.  Building university matching.
9.  Building university project workflow.
10. Building industry partnership workflow.
11. Building project milestones.
12. Building government analytics.
13. Adding seed data.
14. Testing the complete demo scenario.

Before adding a new feature, ask:

> "Is this required for the MVP end-to-end workflow?"

If the answer is no, defer it.

The priority is **a polished, working end-to-end prototype**, not
maximum feature count.


---

# 38. Challenge Subscription & Email Notification System

The MVP must allow students and universities to opt into email notifications for newly submitted/validated societal challenges that match their interests and capabilities.

The purpose is to make the platform proactive: users should not have to repeatedly search the portal to discover relevant challenges.

## 38.1 Student Email Subscriptions

Students can configure their notification preferences from their profile.

### Student can select

- Challenge domains/categories
- Technical skills
- Districts/locations
- Optional priority level
- Email frequency

Example:

```text
My Challenge Interests

Domains:
☑ Agriculture
☑ Water Management
☐ Healthcare
☐ Education
☐ Environment

Skills:
☑ AI / Machine Learning
☑ IoT
☑ Computer Vision
☐ Robotics

Districts:
☑ Ranchi
☑ Dumka
☐ Dhanbad

Email Notifications:
☑ New matching challenges
☑ Challenge assigned to my university
☑ Project/team updates
☑ Important deadlines

Frequency:
○ Instant
● Daily Digest
○ Weekly Digest
```

## 38.2 University Email Subscriptions

Universities should also be able to subscribe based on their capabilities.

University notification matching can use:

- Departments
- Research areas
- Faculty expertise
- Innovation capabilities
- Supported domains
- District/location preferences

For example:

```text
University:
ABC University

Expertise:
Agriculture
IoT
Water Management

Notification:
☑ New matching challenges
☑ Challenges recommended to university
☑ Assignment updates
☑ Partnership opportunities
```

When a relevant challenge is validated, the designated university administrators should receive an email notification.

---

# 39. Intelligent Notification Matching

Email notifications should not be sent to every user.

Use the same AI analysis generated for the problem to determine who should receive an alert.

```text
NEW PROBLEM
     ↓
AI ANALYSIS
     ↓
Category
Required Skills
District
Priority
     ↓
SUBSCRIPTION MATCHING ENGINE
     ↓
Find matching students
Find matching universities
     ↓
Notification Queue
     ↓
Email Service
     ↓
Recipients
```

Example:

```text
New Problem:
"AI-based crop disease detection for farmers"

AI:
Category = Agriculture
Skills = AI + Computer Vision
District = Dumka

Matching students:
Student A → 94%
Student B → 88%

Matching university:
University X → 91%
```

Only relevant subscribed users receive the alert.

---

# 40. Notification Matching Score

For MVP, use a simple explainable score.

```text
Category match       35%
Skill match          40%
District match       15%
Priority preference  10%
```

Example:

```text
notification_score =
    category_match * 0.35 +
    skill_match * 0.40 +
    district_match * 0.15 +
    priority_match * 0.10
```

Send an email when the score is above a configurable threshold, for example 70%.

The threshold should be stored in configuration rather than hard-coded throughout the application.

---

# 41. Email Frequency

Support these MVP options:

### Instant

Send an email shortly after a matching challenge becomes eligible for notification.

### Daily Digest

Collect matching challenges and send one email containing all relevant challenges.

For MVP, **Instant + Daily Digest** is sufficient.

Weekly Digest can be implemented later.

---

# 42. Email Notification Types

Implement these notification types:

```text
NEW_MATCHING_CHALLENGE
CHALLENGE_ASSIGNED
CHALLENGE_ACCEPTED
PROJECT_UPDATE
MILESTONE_DEADLINE
PARTNERSHIP_OPPORTUNITY
```

The user must be able to enable/disable each category.

---

# 43. Email Content

A matching challenge email should contain:

```text
Subject:
New Challenge Matching Your Interests — AI + Agriculture

Hello [Name],

A new societal challenge matches your selected interests.

Challenge:
AI-Based Crop Disease Detection

Location:
Dumka, Jharkhand

Domains:
Agriculture, AI

Required Skills:
Machine Learning, Computer Vision

Priority:
High

Why this matches you:
Your subscription includes Agriculture and AI/ML.

[VIEW CHALLENGE]
```

Do not expose private citizen information in emails.

For example, do not include the citizen's phone number, personal email, or private documents.

---

# 44. Database Additions

Add the following tables to the database schema.

## notification_preferences

```text
id UUID PK
user_id UUID FK UNIQUE
email_enabled BOOLEAN DEFAULT true
new_challenge_enabled BOOLEAN DEFAULT true
challenge_assigned_enabled BOOLEAN DEFAULT true
project_update_enabled BOOLEAN DEFAULT true
deadline_enabled BOOLEAN DEFAULT true
partnership_enabled BOOLEAN DEFAULT true
frequency VARCHAR
created_at
updated_at
```

Allowed frequency values:

```text
INSTANT
DAILY
```

## email_subscriptions

```text
id UUID PK
user_id UUID FK
subscription_type VARCHAR
categories JSONB
skills JSONB
districts JSONB
minimum_priority VARCHAR nullable
enabled BOOLEAN DEFAULT true
created_at
updated_at
```

`subscription_type`:

```text
STUDENT
UNIVERSITY
```

## email_logs

```text
id UUID PK
user_id UUID FK
notification_type VARCHAR
subject
status
sent_at
provider_message_id nullable
error_message nullable
created_at
```

Recommended status values:

```text
QUEUED
SENT
FAILED
```

---

# 45. Notification Architecture

Add a notification service to the application.

```text
lib/notifications/
 ├── matcher.js
 ├── preferences.js
 ├── email.js
 ├── templates.js
 └── queue.js
```

Flow:

```text
Problem Validated
       ↓
AI Analysis Available
       ↓
Find Matching Subscriptions
       ↓
Check User Preferences
       ↓
Create Notification Records
       ↓
Queue Email
       ↓
Send Email
       ↓
Write Email Log
```

Keep the email provider behind an abstraction so the provider can be changed later.

Example interface:

```text
sendEmail({
  to,
  subject,
  template,
  data
})
```

Do not put email-provider credentials in frontend code.

---

# 46. Notification APIs

Add:

```text
GET   /api/notifications
PATCH /api/notifications/:id/read

GET   /api/notification-preferences
PATCH /api/notification-preferences

GET   /api/subscriptions
POST  /api/subscriptions
PATCH /api/subscriptions/:id
DELETE /api/subscriptions/:id
```

For admin/internal processing:

```text
POST /api/notifications/process
POST /api/notifications/send-digest
```

These internal endpoints must be protected and must not be callable by ordinary users.

---

# 47. Notification UI

Add a notification settings page for students and universities.

Route:

```text
/settings/notifications
```

Sections:

```text
Email Notifications
    [ON/OFF]

New Challenge Alerts
    [ON/OFF]

Project Updates
    [ON/OFF]

Deadlines
    [ON/OFF]

My Challenge Interests
    Categories
    Skills
    Districts

Email Frequency
    Instant
    Daily Digest
```

Also provide a notification bell in the application header.

---

# 48. Notification Privacy & Reliability

Important rules:

1. Never send private citizen information unnecessarily.
2. Respect unsubscribe/disabled preferences.
3. Do not send duplicate emails for the same event.
4. Record every email attempt in `email_logs`.
5. Retry failed email delivery where supported.
6. Do not block problem submission because email delivery failed.
7. Use background processing/queueing where possible.
8. Do not expose email addresses to other students.
9. Allow users to disable all email notifications.
10. Use verified email addresses for account notifications.

---

# 49. Updated MVP Demo

The notification feature must be included in the main demo.

### Step 1

Student logs in.

### Step 2

Student opens:

```text
Settings → Challenge Notifications
```

Selects:

```text
Agriculture
AI/ML
IoT
Dumka
```

and enables:

```text
New matching challenges
```

### Step 3

Citizen submits:

```text
Smart irrigation system for small farmers
```

### Step 4

AI identifies:

```text
Agriculture
Water Management
IoT
Electronics
Dumka
High Priority
```

### Step 5

Admin validates the problem.

### Step 6

Notification engine finds the subscribed student and relevant university.

### Step 7

Student receives:

```text
🚨 New Challenge Matching Your Interests

Smart Irrigation for Small Farmers
Dumka, Jharkhand

Agriculture · IoT · Water Management

[View Challenge]
```

### Step 8

University administrator receives a similar institutional notification.

This demonstrates that the platform actively connects problems with people who can solve them.

---

# 50. Updated End-to-End MVP Architecture

The complete MVP workflow is now:

```text
                         CITIZEN
                            │
                            ▼
                    SUBMIT PROBLEM
                            │
                            ▼
                     AI ANALYSIS
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          CATEGORY      PRIORITY      REQUIRED SKILLS
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                    DUPLICATE CHECK
                            │
                            ▼
                       VALIDATION
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      UNIVERSITY MATCHING          SUBSCRIPTION MATCHING
              │                           │
              ▼                           ▼
       UNIVERSITY EMAIL             STUDENT EMAIL
              │                    UNIVERSITY EMAIL
              │                           │
              ▼                           ▼
      UNIVERSITY ACCEPTS          USER DISCOVERS CHALLENGE
              │
              ▼
         PROJECT CREATED
              │
              ▼
        TEAM + FACULTY
              │
              ▼
       SOLUTION PROPOSAL
              │
              ▼
       INDUSTRY PARTNER
              │
       ┌──────┼────────┐
       ▼      ▼        ▼
    FUNDING  MENTOR  RESOURCES
       │      │        │
       └──────┼────────┘
              ▼
          PROTOTYPE
              │
              ▼
          FIELD PILOT
              │
              ▼
        IMPACT METRICS
              │
              ▼
       GOVERNMENT DASHBOARD
```

---

# 51. Updated Definition of Done

The MVP is complete only when this scenario works without developer intervention:

```text
Citizen submits problem
        ↓
AI analyzes problem
        ↓
Admin validates
        ↓
Matching engine finds universities
        ↓
Matching engine finds subscribed students/universities
        ↓
Relevant email notifications are sent
        ↓
University accepts challenge
        ↓
University creates team
        ↓
Proposal submitted
        ↓
Industry offers support
        ↓
Partnership accepted
        ↓
Milestones tracked
        ↓
Impact recorded
        ↓
Government dashboard updates
```

Email notification is therefore a **core MVP capability**, not a future feature.

---

# 52. Local, Excel/CSV-Editable Dataset Management

The person maintaining this platform is not expected to write SQL to
update reference data. This section defines a clear split between
**reference/master data** (edited by a human in a spreadsheet) and
**operational data** (created by the app itself through normal use).

## 52.1 What counts as reference data

Reference data changes rarely and needs to be reviewed/curated by a
human — this is exactly the data the university-matching and
notification-matching engines in Sections 10, 25, 39, 40 depend on.
Keep it in editable spreadsheets, not hand-written SQL:

``` text
data/seed/universities.xlsx      → organizations (type=UNIVERSITY) + university_profiles
data/seed/departments.xlsx       → departments
data/seed/expertise.xlsx         → expertise, university_expertise, faculty_expertise
data/seed/categories.xlsx        → problem categories / domains used by AI classification
data/seed/districts.xlsx         → Jharkhand districts/blocks used in location dropdowns
data/seed/demo-problems.xlsx     → the ~10 demo problems from Section 29 (Seed Data)
```

Each file is a normal spreadsheet with a header row matching the
target table's columns (plus a natural-language `notes` column where
useful). Anyone can open these in Excel, Google Sheets, or LibreOffice
and edit rows directly — add a university, correct a department name,
add a new problem category — with no code or SQL knowledge required.

## 52.2 What stays purely in the database

Everything generated by the running application must **not** live in
a spreadsheet, because spreadsheets have no concurrency control and
would silently conflict with live user data:

``` text
problems, problem_media, problem_ai_analysis, problem_similarity,
university_matches, challenges, projects, project_members, proposals,
milestones, milestone_evidence, partnership_requests, impact_metrics,
comments, notifications, audit_logs, profiles
```

These remain exactly as specified in Section 19 (Database Schema),
stored only in SQLite/Postgres.

## 52.3 The import workflow

``` text
Edit a spreadsheet in data/seed/
        ↓
Run: npm run seed:import
        ↓
scripts/seed-from-excel.js reads each .xlsx with the `xlsx`
(SheetJS) package
        ↓
Rows are validated with the same Zod schemas used elsewhere
        ↓
Upsert into SQLite by a stable natural key
(e.g. university name + district, category name, district name)
        ↓
Console prints a summary: created / updated / skipped / errors
```

Rules:

1.  The importer is idempotent — running it twice with unchanged
    files must not create duplicates. Upsert on a natural key, never
    on row order.
2.  The importer never deletes rows that disappear from the
    spreadsheet; it only reports them, so a human accidentally
    deleting a row doesn't silently destroy live data tied to it
    (e.g. a university with active projects). Deactivation should be
    an explicit `active = false` column in the spreadsheet, not a
    missing row.
3.  Validation errors must point to the exact file, sheet, and row
    number, not just say "import failed."
4.  Also expose the same importer as an **admin-only UI action**
    (`Settings → Import Reference Data`, uploading an .xlsx/.csv
    through the browser) so the platform owner does not need terminal
    access day-to-day — the CLI script and the admin upload button
    should call the same underlying function.
5.  CSV is also acceptable input (SheetJS parses both); prefer .xlsx
    only where multiple related sheets in one workbook are convenient
    (e.g. universities + their department list in two tabs of the
    same file).

## 52.4 Also export, not just import

Add a matching **export** so the reference data can be pulled back
out of the database into spreadsheet form at any time — useful for
review, backup, or handing the dataset to someone else to edit:

``` text
GET /api/admin/reference-data/export?type=universities  → .xlsx download
```

## 52.5 Roadmap beyond the MVP

If/when this moves to a real multi-user deployment, keep the same
spreadsheet-editing habit for the platform owner by building the
admin import/export UI out further, rather than asking anyone to run
SQL against production. Migrating the underlying engine from SQLite
to Postgres/Supabase (Section 3) does not change any of this workflow
— the importer targets the ORM, not the database engine directly.

------------------------------------------------------------------------

# 53. UX4G Design System Compliance

The platform is a citizen-facing government-adjacent service, so its
look, feel, and accessibility must follow **UX4G** (User Experience
for Government Applications) — the official Government of India
design system from MeitY/NeGD (Digital India programme), rather than
a generic SaaS look. This is not just cosmetic: UX4G bundles GIGW
(Government of India Web Guidelines) accessibility compliance, so
adopting it is the fastest path to an accessible, credible-looking
civic platform.

## 53.1 What to install

-   Get the design system's **CDN CSS/JS bundle** from
    `https://doc.ux4g.gov.in/web` and reference it with plain
    `<link>`/`<script>` tags in every page's `<head>` (or once in the
    shared header partial if using EJS, Section 3). There is no
    npm/bundler step in this stack, so the CDN path is the right one
    here — not the npm package.
-   Use the official Figma Design Kit only as a design reference if a
    human is mocking up screens by hand; the build itself should
    consume the CDN's HTML markup/CSS classes directly per UX4G's
    "For Developers → HTML" guide, rather than re-implementing
    components from a screenshot.
-   Do not hand-roll buttons, inputs, tables, navigation, tabs,
    modals, steppers, or OTP inputs — UX4G ships 50+ production
    components covering all of these as plain HTML markup with UX4G
    CSS classes; use them as-is and only theme colors via the
    supported CSS variables.

## 53.2 Required page furniture

Every page (citizen, university, industry, admin) must include the
standard Government of India page shell:

``` text
┌───────────────────────────────────────────────────────────┐
│ [Emblem] Government of Jharkhand      A− A A+  EN | हिं    │  ← accessibility + language toggle
│ [Skip to main content] (visually hidden, keyboard-visible) │
├───────────────────────────────────────────────────────────┤
│  Logo / Portal Name          Nav: Home  Challenges  About  │
├───────────────────────────────────────────────────────────┤
│                                                             │
│                     PAGE CONTENT                           │
│                                                             │
├───────────────────────────────────────────────────────────┤
│ Footer: About · Contact · Terms · Privacy · Sitemap ·      │
│ Related govt links · Ministry/department credit             │
└───────────────────────────────────────────────────────────┘
```

-   **Accessibility toolbar**: font-size steps (A−/A/A+), high
    contrast toggle, and dark mode — use UX4G's own **Accessibility
    Widget** rather than building this from scratch.
-   **Skip to main content** link as the very first focusable element
    on every page.
-   **Language toggle**: at minimum an English/Hindi switch on the
    citizen-facing screens, since the citizen submission form is the
    most likely place for a non-English speaker to land. Full
    translation is a V2 item (Section 36), but the toggle placeholder
    should exist in the MVP shell so it's not a late structural
    change.
-   **Footer** must credit the department/ministry and link Terms,
    Privacy Policy, and Sitemap, matching standard Government of India
    footer patterns.

## 53.3 Accessibility & compliance baseline

-   Target **WCAG 2.1 AA**, which is what UX4G components are built
    to; don't override component internals with custom CSS in ways
    that break focus states or contrast ratios.
-   Follow **GIGW 3.0** accessibility guidance for anything not
    covered by a stock component (custom map widget, custom charts).
-   Because the citizen submission form collects personal and
    location data, show a clear consent statement at the point of
    submission (what is collected, why, who sees it) — align this
    with **DPDP Act 2023** consent expectations rather than a generic
    cookie-banner-style notice.
-   Keep all interactive elements keyboard-navigable and
    screen-reader-labelled; this was already required in Section 28
    (Accessibility) — UX4G components make it the default rather than
    something to re-verify by hand for every custom widget.

## 53.4 Visual identity

-   Use UX4G's default design tokens (colors, spacing, type scale) for
    the MVP rather than inventing a custom brand palette — this keeps
    the product looking instantly recognizable as a legitimate
    government-adjacent service, which matters for citizen trust and
    for a hackathon judge's first impression.
-   If a distinct identity is wanted later, use the official **UX4G
    Theme Craft** Figma plugin to derive a themed palette that still
    inherits UX4G's accessibility guarantees, rather than manually
    overriding colors in CSS.
-   Status badges (problem lifecycle states from Section 11),
    priority tags, and KPI cards on the dashboards (Section 26) should
    use UX4G's existing badge/tag/card components and color tokens,
    so "HIGH priority" or "VALIDATED" reads consistently everywhere in
    the app instead of every screen inventing its own color meaning.

## 53.5 What this changes elsewhere in this document

-   Section 3 (Tech Stack) — UX4G (via CDN) is the primary component
    library for the plain HTML/CSS/JS frontend; hand-written CSS only
    fills gaps UX4G doesn't cover.
-   Section 27 (UI/UX Requirements) — "modern civic-tech product" now
    means "conforms to UX4G," not a free-form interpretation.
-   Section 34 (Build Order), Phase 1 — the government-standard
    header/footer/accessibility shell is built before any feature
    screens, so every later phase inherits it automatically instead of
    retrofitting it at the end.

------------------------------------------------------------------------

# 54. Updated Antigravity Instruction

When implementing the project, include the notification system in the MVP.

After implementing AI analysis and university matching:

1. Implement notification preferences.
2. Implement student subscriptions.
3. Implement university subscriptions.
4. Implement subscription matching.
5. Implement email templates.
6. Implement email delivery abstraction.
7. Implement email logs.
8. Implement notification settings UI.
9. Add seed subscriptions for demo users.
10. Test the complete problem-to-email workflow.

The system must never send every challenge to every student. Notifications must be relevance-based and preference-aware.

Prioritize a reliable end-to-end demo over advanced email infrastructure.

---

# 55. Final Antigravity Build Checklist (Data & Design)

Before starting feature work, confirm these two things are in place —
they change the shape of everything built afterward:

1.  **Local data, not cloud-only**: SQLite file at `data/app.db` via
    `better-sqlite3`; reference data lives in editable spreadsheets
    under `data/seed/` with an idempotent import script and a matching
    admin-UI upload (Section 52). No Supabase/cloud account is
    required to run or demo the MVP.
2.  **Plain HTML/CSS/JS, not a framework**: no React/Next.js/build
    step anywhere; the frontend is real `.html`/`.css`/`.js` files
    served by a plain Express backend (Section 3).
3.  **UX4G, not generic UI**: the Government of India UX4G Design
    System is loaded via CDN and the standard
    header/footer/accessibility shell (emblem, skip-link,
    accessibility toolbar, language toggle, government footer) is
    built in Phase 1, before any feature screens (Section 53).

Every subsequent phase in Section 34 (Build Order) assumes both of
these are already done.
