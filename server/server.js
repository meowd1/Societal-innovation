const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // secure: true in production with HTTPS
}));

// Global variables for views
app.use((req, res, next) => {
    res.locals.userRole = req.session.role || null;
    res.locals.userName = req.session.fullName || null;
    next();
});

const problemsRoutes = require('./routes/problems');
const adminRoutes = require('./routes/admin');
const universityRoutes = require('./routes/university');
const industryRoutes = require('./routes/industry');
const chatRoutes = require('./routes/chat');

// Routes
app.get('/', (req, res) => {
    // Fetch latest 5 problems for the live ticker
    const liveChallenges = db.prepare(`
        SELECT id, title, problem_code 
        FROM problems 
        WHERE status = 'VALIDATED' OR status = 'PROJECT_INITIATED' 
        ORDER BY created_at DESC 
        LIMIT 5
    `).all();
    
    res.render('home', { liveChallenges });
});

const db = require('./db/connection');

app.get('/challenges', (req, res) => {
    // 1. Fetch internal local problems
    const localProblems = db.prepare(`
        SELECT p.*, prof.full_name as submitter_name, pr.status as project_status
        FROM problems p
        JOIN profiles prof ON p.submitted_by = prof.id
        LEFT JOIN projects pr ON p.id = pr.problem_id
        WHERE p.status != 'SUBMITTED'
        ORDER BY p.created_at DESC
    `).all().map(p => ({
        id: p.id,
        isExternal: false,
        title: p.title,
        description: p.description,
        status: p.status,
        project_status: p.project_status,
        code: p.problem_code,
        location: `${p.district || 'Jharkhand'}, ${p.block || ''}`,
        impact: p.affected_population_estimate,
        createdAt: new Date(p.created_at)
    }));
    
    // 2. Fetch external problems (if table exists and has data)
    let externalProblems = [];
    try {
        externalProblems = db.prepare(`SELECT * FROM external_problems ORDER BY published_at DESC`).all().map(p => ({
            id: p.id,
            isExternal: true,
            title: p.title,
            description: p.description,
            sourceName: p.source_name,
            sourceUrl: p.source_url,
            category: p.category,
            status: p.status,
            createdAt: new Date(p.published_at)
        }));
    } catch (e) {
        // Table might not exist yet if migrations haven't run
        console.log("External problems table not found or empty");
    }
    
    // 3. Combine and sort
    const allProblems = [...localProblems, ...externalProblems].sort((a, b) => b.createdAt - a.createdAt);
    
    res.render('public_challenges', { problems: allProblems });
});

app.get('/about', (req, res) => {
    res.render('about');
});
app.use('/', chatRoutes);
app.use('/', authRoutes);
app.use('/', problemsRoutes);
app.use('/', adminRoutes);
app.use('/', universityRoutes);
app.use('/', industryRoutes);

// Error Handling
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
