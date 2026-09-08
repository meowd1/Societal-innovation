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

    // Attempt to use Ollama for real AI analysis
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat';
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

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

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: false,
                format: 'json'
            }),
            signal: AbortSignal.timeout(30000)
        });

        if (response.ok) {
            const data = await response.json();
            const reply = data.message.content;
            
            // Clean out potential markdown or thinking tags
            const jsonStr = reply.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').replace(/```json/gi, '').replace(/```/gi, '').trim();
            const parsedData = JSON.parse(jsonStr);
            
            const validated = aiAnalysisSchema.parse(parsedData);
            console.log('Successfully analyzed problem using Ollama.');
            return validated;
        } else {
            console.error('Ollama returned non-ok status:', response.status);
        }
    } catch (error) {
        console.error('Error during AI analysis via Ollama, falling back to mock data:', error.message);
    }

    console.log('Using mock AI analysis.');
    return aiAnalysisSchema.parse(analysis);
}

module.exports = { analyzeProblem };
