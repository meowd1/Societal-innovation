const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

// University Dashboard
router.get('/university/dashboard', authorize(['UNIVERSITY_ADMIN', 'STUDENT', 'FACULTY']), (req, res) => {
    let matchedProblems = [];
    let myProjects = [];
    let availableProblems = [];
    
    // Get user's organization
    const userOrg = db.prepare(`SELECT organization_id FROM user_organizations WHERE user_id = ?`).get(req.session.userId);
    const orgId = userOrg ? userOrg.organization_id : null;
    
    if (req.session.role === 'UNIVERSITY_ADMIN' && orgId) {
        matchedProblems = db.prepare(`
            SELECT um.*, p.problem_code, p.title, p.status as problem_status, p.id as p_id
            FROM university_matches um
            JOIN problems p ON um.problem_id = p.id
            WHERE um.status = 'RECOMMENDED' AND um.university_id = ?
        `).all(orgId);
    }
    
    // For students/faculty, show their projects
    if (['STUDENT', 'FACULTY', 'UNIVERSITY_ADMIN'].includes(req.session.role)) {
        if (orgId) {
            myProjects = db.prepare(`
                SELECT pr.*, p.title as problem_title, p.problem_code
                FROM projects pr
                JOIN problems p ON pr.problem_id = p.id
                WHERE pr.status NOT IN ('CLOSED') AND pr.lead_university_id = ?
            `).all(orgId);
        }
        
        // Show all validated problems available for opt-in
        availableProblems = db.prepare(`
            SELECT * FROM problems 
            WHERE status = 'VALIDATED'
            ORDER BY created_at DESC
        `).all();
    }
    
    res.render('university/dashboard', { matchedProblems, myProjects, availableProblems, orgId });
});

// View Matched Problem Details
router.get('/university/matches/:matchId', authorize(['UNIVERSITY_ADMIN']), (req, res) => {
    const match = db.prepare(`
        SELECT um.*, p.*, um.id as match_id
        FROM university_matches um
        JOIN problems p ON um.problem_id = p.id
        WHERE um.id = ?
    `).get(req.params.matchId);
    
    if (!match) return res.status(404).send('Match not found');
    
    res.render('university/match_detail', { match });
});

// Accept Match and Create Project
router.post('/university/matches/:matchId/accept', authorize(['UNIVERSITY_ADMIN']), (req, res) => {
    const matchId = req.params.matchId;
    
    db.transaction(() => {
        const match = db.prepare(`SELECT * FROM university_matches WHERE id = ?`).get(matchId);
        
        db.prepare(`UPDATE university_matches SET status = 'ACCEPTED' WHERE id = ?`).run(matchId);
        db.prepare(`UPDATE problems SET status = 'PROJECT_INITIATED' WHERE id = ?`).run(match.problem_id);
        
        const projectId = 'proj-' + Date.now();
        db.prepare(`
            INSERT INTO projects (id, problem_id, lead_university_id, status)
            VALUES (?, ?, ?, 'IDEATION')
        `).run(projectId, match.problem_id, match.university_id);
        
        db.prepare(`
            INSERT INTO audit_logs (id, actor_id, entity_type, entity_id, action)
            VALUES (?, ?, ?, ?, ?)
        `).run('log-' + Date.now(), req.session.userId, 'match', matchId, 'ACCEPTED');
    })();
    
    res.redirect('/university/dashboard');
});

// Reject Match
router.post('/university/matches/:matchId/reject', authorize(['UNIVERSITY_ADMIN']), (req, res) => {
    db.transaction(() => {
        const match = db.prepare(`SELECT * FROM university_matches WHERE id = ?`).get(req.params.matchId);
        db.prepare(`UPDATE university_matches SET status = 'REJECTED' WHERE id = ?`).run(req.params.matchId);
        
        db.prepare(`
            INSERT INTO audit_logs (id, actor_id, entity_type, entity_id, action)
            VALUES (?, ?, ?, ?, ?)
        `).run('log-' + Date.now(), req.session.userId, 'match', req.params.matchId, 'REJECTED');
    })();
    
    res.redirect('/university/dashboard');
});

// View Project
router.get('/university/projects/:projectId', authorize(['UNIVERSITY_ADMIN', 'STUDENT', 'FACULTY']), (req, res) => {
    const project = db.prepare(`
        SELECT pr.*, p.title as problem_title, p.description as problem_desc, p.problem_code
        FROM projects pr
        JOIN problems p ON pr.problem_id = p.id
        WHERE pr.id = ?
    `).get(req.params.projectId);
    
    if (!project) return res.status(404).send('Project not found');
    
    const teamMembers = db.prepare(`
        SELECT pm.*, prof.full_name, prof.email
        FROM project_members pm
        JOIN profiles prof ON pm.profile_id = prof.id
        WHERE pm.project_id = ?
    `).all(project.id);
    
    res.render('university/project_detail', { project, teamMembers });
});

// Update Project Status
router.post('/university/projects/:projectId/status', authorize(['UNIVERSITY_ADMIN', 'FACULTY']), (req, res) => {
    const { status } = req.body;
    db.prepare(`UPDATE projects SET status = ? WHERE id = ?`).run(status, req.params.projectId);
    res.redirect('/university/projects/' + req.params.projectId);
});

// Opt-in to an available problem
router.post('/university/projects/opt-in/:problemId', authorize(['UNIVERSITY_ADMIN', 'STUDENT', 'FACULTY']), (req, res) => {
    const problemId = req.params.problemId;
    
    // Get user's organization
    const userOrg = db.prepare(`SELECT organization_id FROM user_organizations WHERE user_id = ?`).get(req.session.userId);
    if (!userOrg) return res.status(403).send('You do not belong to an organization.');
    
    const orgId = userOrg.organization_id;
    
    db.transaction(() => {
        // Check if problem is still validated
        const problem = db.prepare(`SELECT status FROM problems WHERE id = ?`).get(problemId);
        if (!problem || problem.status !== 'VALIDATED') {
            throw new Error('Problem is no longer available.');
        }
        
        // Update problem status
        db.prepare(`UPDATE problems SET status = 'PROJECT_INITIATED' WHERE id = ?`).run(problemId);
        
        // Create project
        const projectId = 'proj-' + Date.now();
        db.prepare(`
            INSERT INTO projects (id, problem_id, lead_university_id, status)
            VALUES (?, ?, ?, 'IDEATION')
        `).run(projectId, problemId, orgId);
        
        // Add current user as a project member
        db.prepare(`
            INSERT INTO project_members (id, project_id, profile_id, role)
            VALUES (?, ?, ?, ?)
        `).run('pm-' + Date.now(), projectId, req.session.userId, req.session.role === 'STUDENT' ? 'STUDENT' : 'MENTOR');
        
        db.prepare(`
            INSERT INTO audit_logs (id, actor_id, entity_type, entity_id, action)
            VALUES (?, ?, ?, ?, ?)
        `).run('log-' + Date.now(), req.session.userId, 'problem', problemId, 'OPT_IN');
    })();
    
    res.redirect('/university/dashboard');
});

module.exports = router;
