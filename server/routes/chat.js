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

    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat';
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'; // Default model

    try {
        const systemPrompt = `You are an AI advisor for the Jharkhand Societal Innovation Collaboration Portal.
Your job is to help citizens, students, and government officials by providing insights into infrastructural, agricultural, and societal problems.
Keep your responses concise, helpful, and focused on practical solutions. Do not include raw markdown formatting that a simple HTML parser cannot handle (avoid tables, just use text and basic lists).`;

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Ollama responded with status:', response.status, 'body:', errBody);
            return res.status(500).json({ error: 'Failed to generate response from AI' });
        }

        const data = await response.json();
        const reply = data.message.content;

        res.json({ reply });
    } catch (error) {
        console.error('Error connecting to Ollama:', error);
        res.status(500).json({ error: 'Could not connect to local Ollama instance. Is it running?' });
    }
});

module.exports = router;
