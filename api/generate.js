const fetch = require('node-fetch');

// This function handles all incoming requests and routes them to the correct AI model.
// It also adds the necessary headers to prevent "Failed to fetch" errors.
export default async function handler(request, response) {
    // Set CORS headers to allow requests from any origin. This is crucial for testing and for your live frontend.
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle pre-flight OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { type, payload } = request.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return response.status(500).json({ error: 'Server-side API key is not configured.' });
        }

        let apiUrl;

        // Determine the correct Google API URL based on the request 'type'
        switch (type) {
            case 'productAnalysis':
            case 'adCopy':
            case 'campaignText':
                apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                break;
            case 'adImageComposite':
                 apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
                break;
            case 'campaignVisual':
                apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
                break;
            default:
                return response.status(400).json({ error: 'Invalid generation type specified.' });
        }

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error(`Gemini API Error (${type}):`, errorText);
            throw new Error(`API call failed: ${geminiResponse.statusText}`);
        }

        const result = await geminiResponse.json();
        return response.status(200).json(result);

    } catch (error) {
        console.error('Server Error:', error);
        return response.status(500).json({ error: error.message });
    }
}

