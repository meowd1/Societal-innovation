const express = require('express');
const router = express.Router();

// Render Chat UI
router.get('/ai-chat', (req, res) => {
    res.render('ai_chat');
});

// Handle Chat API requests
router.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const OPENROUTER_URL = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const AI_MODEL = process.env.AI_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct:free';
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'AI capabilities are currently disabled (missing OpenRouter API Key).' });
    }

    try {
        const systemPrompt = `You are an AI advisor for the Jharkhand Societal Innovation Collaboration Portal.
Your job is to help citizens, students, and government officials by providing insights into infrastructural, agricultural, and societal problems.
Keep your responses concise, helpful, and focused on practical solutions. Do not include raw markdown formatting that a simple HTML parser cannot handle (avoid tables, just use text and basic lists).`;

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
                    { role: 'user', content: message }
                ]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('OpenRouter responded with status:', response.status, 'body:', errBody);
            return res.status(500).json({ error: 'Failed to generate response from AI' });
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        res.json({ reply });
    } catch (error) {
        console.error('Error connecting to OpenRouter:', error);
        res.status(500).json({ error: 'Could not connect to AI service. Please try again later.' });
    }
});

module.exports = router;
