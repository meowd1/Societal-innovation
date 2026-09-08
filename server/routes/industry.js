const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

// Industry Dashboard
router.get('/industry/dashboard', authorize(['INDUSTRY_PARTNER']), (req, res) => {
    // Show active projects that might need industry partners
    const opportunities = db.prepare(`
        SELECT pr.*, p.title as problem_title, p.description as problem_desc, p.problem_code, o.name as university_name
        FROM projects pr
        JOIN problems p ON pr.problem_id = p.id
        JOIN organizations o ON pr.lead_university_id = o.id
        WHERE pr.status NOT IN ('COMPLETED', 'CLOSED')
    `).all();
    
    // Show projects this partner is already involved in
    const myProjects = db.prepare(`
        SELECT pr.*, p.title as problem_title, p.problem_code
        FROM project_partners pp
        JOIN projects pr ON pp.project_id = pr.id
        JOIN problems p ON pr.problem_id = p.id
        WHERE pp.organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = ?)
    `).all(req.session.userId);
    
    res.render('industry/dashboard', { opportunities, myProjects });
});

// Partner with Project
router.post('/industry/projects/:projectId/partner', authorize(['INDUSTRY_PARTNER']), (req, res) => {
    // In a real app, you would retrieve the partner's organization ID.
    // For MVP demo, we assume the user is part of org-4 (IoT Startup)
    const orgId = 'org-4'; 
    
    db.prepare(`
        INSERT INTO project_partners (id, project_id, organization_id, status)
        VALUES (?, ?, ?, 'INTERESTED')
    `).run('partner-' + Date.now(), req.params.projectId, orgId);
    
    res.redirect('/industry/dashboard');
});

module.exports = router;
