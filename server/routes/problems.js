const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

// Ensure user is logged in for all problem routes
router.use(authenticate);

// List problems for citizen dashboard
router.get('/citizen/dashboard', authorize(['CITIZEN']), (req, res) => {
    const problems = db.prepare(`
        SELECT p.*, pr.status as project_status 
        FROM problems p
        LEFT JOIN projects pr ON p.id = pr.problem_id
        WHERE p.submitted_by = ? 
        ORDER BY p.created_at DESC
    `).all(req.session.userId);
    
    res.render('citizen/dashboard', { problems });
});

// View problem submission form
router.get('/citizen/problems/new', authorize(['CITIZEN']), (req, res) => {
    res.render('citizen/submit');
});

// Submit a new problem
router.post('/citizen/problems/new', authorize(['CITIZEN']), upload.single('photo'), (req, res) => {
    const { title, description, category, district, block, village, latitude, longitude, citizen_priority, affected_population_estimate } = req.body;
    
    const problemId = 'prob-' + Date.now();
    const problemCode = 'JH-2026-' + String(Math.floor(Math.random() * 900000) + 100000);
    
    db.transaction(() => {
        db.prepare(`
            INSERT INTO problems (id, problem_code, submitted_by, title, description, district, block, village, latitude, longitude, citizen_priority, affected_population_estimate, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
        `).run(problemId, problemCode, req.session.userId, title, description, district, block, village, latitude, longitude, citizen_priority, affected_population_estimate);
        
        if (req.file) {
            db.prepare(`
                INSERT INTO problem_media (id, problem_id, type, storage_path, mime_type)
                VALUES (?, ?, ?, ?, ?)
            `).run('media-' + Date.now(), problemId, 'photo', '/uploads/' + req.file.filename, req.file.mimetype);
        }
        
        db.prepare(`
            INSERT INTO audit_logs (id, actor_id, entity_type, entity_id, action)
            VALUES (?, ?, ?, ?, ?)
        `).run('log-' + Date.now(), req.session.userId, 'problem', problemId, 'SUBMITTED');
    })();
    
    res.redirect('/citizen/dashboard');
});

// View problem details
router.get('/citizen/problems/:id', authorize(['CITIZEN']), (req, res) => {
    const problem = db.prepare(`
        SELECT p.*, pr.status as project_status
        FROM problems p
        LEFT JOIN projects pr ON p.id = pr.problem_id
        WHERE p.id = ? AND p.submitted_by = ?
    `).get(req.params.id, req.session.userId);
    
    if (!problem) return res.status(404).send('Problem not found');
    
    const media = db.prepare(`SELECT * FROM problem_media WHERE problem_id = ?`).all(problem.id);
    const aiAnalysis = db.prepare(`SELECT * FROM problem_ai_analysis WHERE problem_id = ?`).get(problem.id);
    
    res.render('citizen/detail', { problem, media, aiAnalysis });
});

// AI Analysis API
router.post('/api/problems/:id/analyze', authorize(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const problem = db.prepare(`SELECT * FROM problems WHERE id = ?`).get(req.params.id);
        if (!problem) return res.status(404).json({ error: 'Problem not found' });
        
        const { analyzeProblem } = require('../lib/ai/analyzer');
        const analysis = await analyzeProblem(problem);
        
        db.transaction(() => {
            db.prepare(`
                INSERT OR REPLACE INTO problem_ai_analysis 
                (id, problem_id, primary_category, secondary_categories, summary, problem_type, priority, required_skills, keywords, confidence, raw_response)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                'ai-' + Date.now(), 
                problem.id, 
                analysis.primary_category, 
                JSON.stringify(analysis.secondary_categories), 
                analysis.summary, 
                analysis.problem_type, 
                analysis.priority, 
                JSON.stringify(analysis.required_skills), 
                JSON.stringify(analysis.keywords), 
                analysis.confidence, 
                JSON.stringify(analysis)
            );
            
            db.prepare(`UPDATE problems SET status = 'PENDING_VALIDATION' WHERE id = ?`).run(problem.id);
        })();
        
        res.redirect('/admin/problems/' + problem.id);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error during AI analysis');
    }
});

// University Matching API
router.post('/api/problems/:id/match-universities', authorize(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const { matchUniversities } = require('../lib/matching/university-matcher');
        await matchUniversities(req.params.id);
        
        // In a complete implementation, this would trigger email notifications to matching students & universities here.
        
        res.redirect('/admin/problems/' + req.params.id);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error during matching');
    }
});

module.exports = router;
