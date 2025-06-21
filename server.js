const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your Netlify app
app.use(cors({
    origin: [
        'https://legaldraft-pro.netlify.app',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'LegalDraft API is running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Claude API proxy with NO timeout limits
app.post('/api/claude', async (req, res) => {
    try {
        const { apiKey, messages, model = 'claude-3-5-sonnet-20241022', max_tokens = 4000 } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        console.log('Starting Claude API call...');
        const startTime = Date.now();
        
        // NO timeout - let Claude take as long as it needs for quality work
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens, // Full 4000 tokens for complete documents
                messages
            })
        });
        
        const duration = Date.now() - startTime;
        console.log(`Claude API call completed in ${duration}ms`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API Error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `Claude API error: ${response.statusText}`,
                details: errorText
            });
        }
        
        const data = await response.json();
        
        return res.json({
            ...data,
            metadata: {
                duration_ms: duration,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`LegalDraft API server running on port ${PORT}`);
    console.log('No timeout limits - AI can take as long as needed for quality work');
});
