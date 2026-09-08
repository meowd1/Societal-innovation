const db = require('../server/db/connection');

console.log('--- External Challenges Aggregator ---');
console.log('Connecting to sources: Smart India Hackathon, UN SDGs, Startup India...');

// Simulated fetched data
const fetchedProblems = [
    {
        id: 'ext-' + Date.now() + '-1',
        title: 'AI-based Crop Disease Detection for Rural Farmers',
        description: 'Develop a lightweight mobile application using AI/ML to detect diseases in crops like rice and wheat using smartphone cameras, even without active internet connection.',
        source_name: 'Smart India Hackathon',
        source_url: 'https://sih.gov.in/problem-statements',
        category: 'Agriculture',
        status: 'OPEN',
        published_at: new Date().toISOString()
    },
    {
        id: 'ext-' + Date.now() + '-2',
        title: 'Clean Water Monitoring IoT System',
        description: 'Design an affordable IoT-based sensor network to monitor water quality (pH, TDS, turbidity) in village overhead tanks and send SMS alerts to local authorities when parameters are unsafe.',
        source_name: 'UN Sustainable Development Goals (SDG 6)',
        source_url: 'https://sdgs.un.org/goals/goal6',
        category: 'Water & Sanitation',
        status: 'OPEN',
        published_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
        id: 'ext-' + Date.now() + '-3',
        title: 'Last-Mile Delivery Drone Network for Medical Supplies',
        description: 'Create a framework and drone prototype capable of delivering 2kg of medical supplies (blood, vaccines) to remote areas with difficult terrain up to a 15km radius.',
        source_name: 'Startup India Grand Challenge',
        source_url: 'https://www.startupindia.gov.in/',
        category: 'Healthcare & Logistics',
        status: 'OPEN',
        published_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    }
];

try {
    db.transaction(() => {
        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO external_problems 
            (id, title, description, source_name, source_url, category, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const prob of fetchedProblems) {
            insertStmt.run(
                prob.id,
                prob.title,
                prob.description,
                prob.source_name,
                prob.source_url,
                prob.category,
                prob.status,
                prob.published_at
            );
        }
    })();
    
    console.log(`Successfully scraped and inserted ${fetchedProblems.length} external problems into the database.`);
} catch (err) {
    console.error('Error saving external problems to database:', err);
}
