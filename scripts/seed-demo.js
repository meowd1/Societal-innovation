const db = require('../server/db/connection');
const bcrypt = require('bcryptjs');

async function seedDemoData() {
    console.log('Starting demo data seeding...');

    // Users data
    const users = [
        { id: 'usr-1', name: 'Citizen Demo', email: 'citizen@demo.com', role: 'CITIZEN' },
        { id: 'usr-2', name: 'Admin Demo', email: 'admin@demo.com', role: 'GOVERNMENT_ADMIN' },
        { id: 'usr-3', name: 'University Admin', email: 'university@demo.com', role: 'UNIVERSITY_ADMIN' },
        { id: 'usr-4', name: 'Student Demo', email: 'student@demo.com', role: 'STUDENT' },
        { id: 'usr-5', name: 'Industry Partner', email: 'industry@demo.com', role: 'INDUSTRY_PARTNER' },
        { id: 'usr-6', name: 'Faculty Mentor', email: 'faculty@demo.com', role: 'FACULTY' },
        { id: 'usr-7', name: 'Super Admin', email: 'super@demo.com', role: 'SUPER_ADMIN' }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    const insertUser = db.prepare(`
        INSERT OR IGNORE INTO profiles (id, full_name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
        for (const user of users) {
            insertUser.run(user.id, user.name, user.email, passwordHash, user.role);
            console.log(`Created user: ${user.email} as ${user.role}`);
        }
    })();
    
    // Seed Problems
    const insertProblem = db.prepare(`
        INSERT OR IGNORE INTO problems (id, problem_code, submitted_by, title, description, district, block, village, latitude, longitude, citizen_priority, affected_population_estimate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
        insertProblem.run(
            'prob-2',
            'JH-2026-902143',
            'usr-1',
            'Severe Urban Sewage Overflow in Monsoons',
            'Every monsoon season, the main sewage lines in Sector 4 overflow into the streets, causing severe health hazards and traffic blockades. The current drainage capacity is insufficient for the population density.',
            'Ranchi', 'City Center', 'Sector 4', 23.3441, 85.3096, 'High', 15000, 'VALIDATED'
        );

        insertProblem.run(
            'prob-3',
            'JH-2026-382910',
            'usr-1',
            'Recurrent Landslides on Village Access Road',
            'The only road connecting our village to the main highway suffers from recurrent landslides during heavy rains. We need a geological survey and a low-cost retaining wall solution to prevent isolation during emergencies.',
            'Latehar', 'Mahuadanr', 'Aksi', 23.3987, 84.1122, 'Critical', 800, 'PROJECT_INITIATED'
        );
    })();
    
    // Seed Organizations
    const insertOrg = db.prepare(`
        INSERT OR IGNORE INTO organizations (id, name, type, district)
        VALUES (?, ?, ?, ?)
    `);
    
    db.transaction(() => {
        insertOrg.run('org-1', 'University A', 'UNIVERSITY', 'Ranchi');
        insertOrg.run('org-2', 'University B', 'UNIVERSITY', 'Dumka');
        insertOrg.run('org-3', 'University C', 'UNIVERSITY', 'Dhanbad');
        insertOrg.run('org-4', 'IoT Startup', 'STARTUP', 'Ranchi');
    })();

    // Seed User Organizations mapping
    const insertUserOrg = db.prepare(`
        INSERT OR IGNORE INTO user_organizations (id, user_id, organization_id)
        VALUES (?, ?, ?)
    `);

    db.transaction(() => {
        insertUserOrg.run('uo-1', 'usr-3', 'org-1'); // University Admin belongs to University A
        insertUserOrg.run('uo-2', 'usr-4', 'org-1'); // Student belongs to University A
        insertUserOrg.run('uo-3', 'usr-6', 'org-1'); // Faculty belongs to University A
        insertUserOrg.run('uo-4', 'usr-5', 'org-4'); // Industry Partner belongs to IoT Startup
    })();

    console.log('Demo data seeded successfully.');
}

seedDemoData().catch(console.error);
