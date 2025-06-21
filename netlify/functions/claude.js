// Save this as: netlify/functions/claude.js
// This creates an API endpoint at: https://legaldraft-pro.netlify.app/.netlify/functions/claude

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    // Add CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const { apiKey, messages, model = 'claude-3-sonnet-20240229', max_tokens = 4000 } = JSON.parse(event.body);
        
        if (!apiKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'API key is required' })
            };
        }
        
        // Call Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens,
                messages
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Claude API error: ${response.statusText}`,
                    details: errorText
                })
            };
        }
        
        const data = await response.json();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
        
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};
