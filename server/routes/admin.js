const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

// Admin dashboard
router.get('/admin/dashboard', authorize(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req, res) => {
    // Basic KPIs for dashboard
    const stats = {
        totalProblems: db.prepare(`SELECT COUNT(*) as count FROM problems`).get().count,
        validatedProblems: db.prepare(`SELECT COUNT(*) as count FROM problems WHERE status = 'VALIDATED'`).get().count,
        activeProjects: db.prepare(`SELECT COUNT(*) as count FROM projects WHERE status NOT IN ('COMPLETED', 'CLOSED')`).get().count,
        universities: db.prepare(`SELECT COUNT(*) as count FROM organizations WHERE type = 'UNIVERSITY'`).get().count
    };
    
    // Fetch recent problems
    const recentProblems = db.prepare(`
        SELECT p.*, prof.full_name as citizen_name, pr.status as project_status
        FROM problems p
        JOIN profiles prof ON p.submitted_by = prof.id
        LEFT JOIN projects pr ON p.id = pr.problem_id
        ORDER BY p.created_at DESC LIMIT 10
    `).all();
    
    res.render('admin/dashboard', { stats, recentProblems });
});

// View problem list
router.get('/admin/problems', authorize(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const statusFilter = req.query.status || '';
    
    let query = `
        SELECT p.*, prof.full_name as citizen_name, pr.status as project_status
        FROM problems p
        JOIN profiles prof ON p.submitted_by = prof.id
        LEFT JOIN projects pr ON p.id = pr.problem_id
    `;
    
    if (statusFilter) {
        query += ` WHERE p.status = '${statusFilter}'`;
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const problems = db.prepare(query).all();
    res.render('admin/problems', { problems, currentStatus: statusFilter });
});

// View problem details for validation
router.get('/admin/problems/:id', authorize(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const problem = db.prepare(`
        SELECT p.*, prof.full_name as citizen_name, pr.status as project_status
        FROM problems p
        JOIN profiles prof ON p.submitted_by = prof.id
        LEFT JOIN projects pr ON p.id = pr.problem_id
        WHERE p.id = ?
    `).get(req.params.id);
    
    if (!problem) return res.status(404).send('Problem not found');
    
    const media = db.prepare(`SELECT * FROM problem_media WHERE problem_id = ?`).all(problem.id);
    const aiAnalysis = db.prepare(`SELECT * FROM problem_ai_analysis WHERE problem_id = ?`).get(problem.id);
    const duplicates = db.prepare(`
        SELECT d.*, p2.title, p2.problem_code 
        FROM problem_similarity d
        JOIN problems p2 ON d.similar_problem_id = p2.id
        WHERE d.problem_id = ?
    `).all(problem.id);
    
    const matches = db.prepare(`
        SELECT um.*, o.name as university_name
        FROM university_matches um
        JOIN organizations o ON um.university_id = o.id
        WHERE um.problem_id = ?
        ORDER BY um.match_score DESC
    `).all(problem.id);
    
    const universities = db.prepare(`SELECT id, name FROM organizations WHERE type = 'UNIVERSITY' ORDER BY name ASC`).all();
    
    res.render('admin/problem_detail', { problem, media, aiAnalysis, duplicates, matches, universities });
});

// Validate Problem
router.post('/admin/problems/:id/validate', authorize(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const { action } = req.body; // 'VALIDATE' or 'REJECT'
    const newStatus = action === 'VALIDATE' ? 'VALIDATED' : 'REJECTED';
    
    db.transaction(() => {
        db.prepare(`UPDATE problems SET status = ? WHERE id = ?`).run(newStatus, req.params.id);
        
        db.prepare(`
            INSERT INTO audit_logs (id, actor_id, entity_type, entity_id, action)
            VALUES (?, ?, ?, ?, ?)
        `).run('log-' + Date.now(), req.session.userId, 'problem', req.params.id, newStatus);
    })();
    
    // In a real app, you would trigger the University matching and notification engine here if VALIDATED.
    
    res.redirect('/admin/problems/' + req.params.id);
});

// Assign Problem to University
router.post('/admin/problems/:id/assign', authorize(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const { university_id } = req.body;
    
    if (!university_id) {
        return res.status(400).send('University ID is required');
    }

    db.transaction(() => {
        // Create a university match that is automatically recommended with 100% score
        const matchId = 'match-' + Date.now();
        db.prepare(`
            INSERT INTO university_matches (id, problem_id, university_id, match_score, matching_reasons, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(matchId, req.params.id, university_id, 1.0, JSON.stringify(['Manually assigned by Administrator']), 'RECOMMENDED');
        
        db.prepare(`
            INSERT INTO audit_logs (id, actor_id, entity_type, entity_id, action)
            VALUES (?, ?, ?, ?, ?)
        `).run('log-' + Date.now(), req.session.userId, 'problem_assignment', req.params.id, 'ASSIGNED_TO_' + university_id);
    })();
    
    res.redirect('/admin/problems/' + req.params.id);
});

// Delete Problem
router.post('/admin/problems/:id/delete', authorize(['GOVERNMENT_ADMIN', 'SUPER_ADMIN']), (req, res) => {
    db.transaction(() => {
        const id = req.params.id;
        
        // Manual cascade delete to avoid FK constraints
        db.prepare('DELETE FROM problem_media WHERE problem_id = ?').run(id);
        db.prepare('DELETE FROM problem_ai_analysis WHERE problem_id = ?').run(id);
        db.prepare('DELETE FROM problem_similarity WHERE problem_id = ? OR similar_problem_id = ?').run(id, id);
        db.prepare('DELETE FROM university_matches WHERE problem_id = ?').run(id);
        db.prepare('DELETE FROM challenges WHERE problem_id = ?').run(id);
        db.prepare('DELETE FROM comments WHERE problem_id = ?').run(id);
        
        const projects = db.prepare('SELECT id FROM projects WHERE problem_id = ?').all(id);
        for (const proj of projects) {
            db.prepare('DELETE FROM project_members WHERE project_id = ?').run(proj.id);
            db.prepare('DELETE FROM project_partners WHERE project_id = ?').run(proj.id);
            db.prepare('DELETE FROM proposals WHERE project_id = ?').run(proj.id);
            
            const milestones = db.prepare('SELECT id FROM milestones WHERE project_id = ?').all(proj.id);
            for (const m of milestones) {
                db.prepare('DELETE FROM milestone_evidence WHERE milestone_id = ?').run(m.id);
            }
            db.prepare('DELETE FROM milestones WHERE project_id = ?').run(proj.id);
            
            db.prepare('DELETE FROM partnership_requests WHERE project_id = ?').run(proj.id);
            db.prepare('DELETE FROM impact_metrics WHERE project_id = ?').run(proj.id);
            db.prepare('DELETE FROM comments WHERE project_id = ?').run(proj.id);
            
            db.prepare('DELETE FROM projects WHERE id = ?').run(proj.id);
        }
        
        db.prepare('DELETE FROM problems WHERE id = ?').run(id);
        
        db.prepare(`
            INSERT INTO audit_logs (id, actor_id, entity_type, entity_id, action)
            VALUES (?, ?, ?, ?, ?)
        `).run('log-' + Date.now(), req.session.userId, 'problem', id, 'DELETED');
    })();
    
    res.redirect('/admin/problems');
});

module.exports = router;
