const db = require('../../db/connection');

function calculateMatchScore(problemSkills, problemCategory, orgId) {
    // A mock scoring engine based on the MVP architecture
    // Real implementation would compare problemSkills against university_expertise 
    
    // Hardcoded logic for demo purposes
    if (orgId === 'org-1' && problemCategory === 'Agriculture') return 0.92;
    if (orgId === 'org-2' && problemCategory === 'Agriculture') return 0.84;
    if (orgId === 'org-3' && problemCategory === 'Agriculture') return 0.71;
    
    return Math.random() * 0.4 + 0.4; // random score between 0.4 and 0.8
}

function getMatchingReasons(orgId, problemCategory) {
    if (orgId === 'org-1' && problemCategory === 'Agriculture') {
        return [
            "Agriculture department",
            "IoT research capability",
            "Relevant faculty",
            "Water-management research"
        ];
    }
    return ["Relevant domain", "Geographic proximity"];
}

async function matchUniversities(problemId) {
    const problem = db.prepare(`SELECT * FROM problems WHERE id = ?`).get(problemId);
    if (!problem) throw new Error("Problem not found");
    
    const analysis = db.prepare(`SELECT * FROM problem_ai_analysis WHERE problem_id = ?`).get(problemId);
    const category = analysis ? analysis.primary_category : '';
    const skills = analysis && analysis.required_skills ? JSON.parse(analysis.required_skills) : [];
    
    const universities = db.prepare(`SELECT * FROM organizations WHERE type = 'UNIVERSITY'`).all();
    
    const matches = [];
    
    db.transaction(() => {
        for (const uni of universities) {
            const score = calculateMatchScore(skills, category, uni.id);
            const reasons = getMatchingReasons(uni.id, category);
            
            const matchId = 'match-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            
            db.prepare(`
                INSERT INTO university_matches (id, problem_id, university_id, match_score, matching_reasons, status)
                VALUES (?, ?, ?, ?, ?, 'RECOMMENDED')
            `).run(matchId, problemId, uni.id, score, JSON.stringify(reasons));
            
            matches.push({ uniId: uni.id, score, reasons });
        }
        
        db.prepare(`UPDATE problems SET status = 'MATCHING' WHERE id = ?`).run(problemId);
    })();
    
    return matches;
}

module.exports = { matchUniversities };
