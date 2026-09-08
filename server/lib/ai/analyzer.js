const { aiAnalysisSchema } = require('./schemas');

async function analyzeProblem(problem) {
    console.log('Analyzing problem:', problem.title);
    
    // Default fallback analysis
    let analysis = {
        primary_category: 'Infrastructure',
        secondary_categories: ['General'],
        summary: 'A general infrastructure issue requiring attention.',
        problem_type: 'General',
        priority: 'MEDIUM',
        required_skills: ['Engineering'],
        keywords: ['infrastructure'],
        confidence: 0.8
    };

    if (problem.title.toLowerCase().includes('irrigation') || problem.description.toLowerCase().includes('farmer')) {
        analysis = {
            primary_category: 'Agriculture',
            secondary_categories: ['Water Management'],
            summary: 'Farmers require an affordable irrigation solution.',
            problem_type: 'Irrigation',
            priority: 'HIGH',
            required_skills: ['Agricultural Engineering', 'IoT', 'Water Management', 'Electronics'],
            keywords: ['irrigation', 'water', 'farmer'],
            confidence: 0.91
        };
    }

    // Attempt to use OpenRouter for real AI analysis
    const OPENROUTER_URL = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const AI_MODEL = process.env.AI_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct:free';
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (OPENROUTER_API_KEY) {
        try {
            const systemPrompt = `You are an AI that analyzes problems submitted by citizens.
Your job is to read the problem title and description, and return a JSON object describing the problem.
The JSON object MUST match this schema:
{
  "primary_category": "string (e.g. Agriculture, Infrastructure, Education)",
  "secondary_categories": ["string", "string"],
  "summary": "string (a concise 1-sentence summary of the problem)",
  "problem_type": "string",
  "priority": "string (MUST be one of: LOW, MEDIUM, HIGH, CRITICAL)",
  "required_skills": ["string", "string"],
  "keywords": ["string", "string"],
  "confidence": 0.95 (number between 0 and 1)
}
Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json. Do not include <thinking> tags or preamble.`;

            const userPrompt = `Title: ${problem.title}\nDescription: ${problem.description}`;

            const response = await fetch(OPENROUTER_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://jsicp-portal.example.com',
                    'X-Title': 'JSICP'
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                }),
                signal: AbortSignal.timeout(30000)
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.choices[0].message.content;
                
                // Clean out potential markdown or thinking tags
                const jsonStr = reply.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').replace(/```json/gi, '').replace(/```/gi, '').trim();
                const parsedData = JSON.parse(jsonStr);
                
                const validated = aiAnalysisSchema.parse(parsedData);
                console.log('Successfully analyzed problem using OpenRouter.');
                return validated;
            } else {
                console.error('OpenRouter returned non-ok status:', response.status);
                const errBody = await response.text();
                console.error(errBody);
            }
        } catch (error) {
            console.error('Error during AI analysis via OpenRouter, falling back to mock data:', error.message);
        }
    } else {
        console.log('No OPENROUTER_API_KEY provided, skipping AI analysis.');
    }

    console.log('Using mock AI analysis.');
    return aiAnalysisSchema.parse(analysis);
}

module.exports = { analyzeProblem };
