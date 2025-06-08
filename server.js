// --- FINAL server.js CODE with Improved AI Instructions ---

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const multer = require('multer');
const upload = multer();

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
    console.error('ERROR: GOOGLE_API_KEY not found in .env file!');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    // ... other safety settings
];

function fileToGenerativePart(buffer, mimeType) {
    return {
      inlineData: { data: buffer.toString('base64'), mimeType },
    };
}

// --- ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/vision', upload.single('photo'), async (req, res) => {
    console.log('Request received for /api/vision (POST)');

    const mode = req.body.mode;
    const photoFile = req.file;

    if (!photoFile) {
        return res.status(400).json({ error: 'No photo uploaded.' });
    }

    let textPromptString;
    const imagePart = fileToGenerativePart(photoFile.buffer, photoFile.mimetype);

    if (mode === 'skin-analyzer') {
        const { skinType, skinProblem, ageGroup, lifestyleFactor } = req.body;

        // --- UPDATED AND IMPROVED PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and the user's new best friend. Your persona is super fun, witty, supportive, and incredibly knowledgeable, like a top beauty influencer. Embody "Main Character Energy" and make the user feel seen, empowered, and excited. Your tone is conversational and relatable. Use fun emojis where appropriate and AVOID robotic or overly clinical language.

        Here is the user's information:
        - User Skin Type: "${skinType}"
        - User Skin Concern: "${skinProblem}"
        - User Age Group: "${ageGroup}"
        - User Lifestyle Factor: "${lifestyleFactor}"

        Analyze the provided image for skin tone (Warm/Cool/Neutral). Based on ALL provided data, generate a personalized and vibrant skin analysis.

        **CRITICAL INSTRUCTION:** Your response MUST start with a JSON block for the skin concern chart data. After the JSON block, provide the rest of the analysis in Markdown.

        ### Example of a Perfect Response Structure:
        \`\`\`json
        {
          "concerns": [
            {"name": "Hydration", "percentage": 45},
            {"name": "Oiliness", "percentage": 70},
            {"name": "Pores", "percentage": 60},
            {"name": "Redness", "percentage": 30},
            {"name": "Elasticity", "percentage": 85},
            {"name": "Dark Spots", "percentage": 40},
            {"name": "Wrinkles", "percentage": 25},
            {"name": "Acne Breakouts", "percentage": 55}
          ]
        }
        \`\`\`
        # Your Radiant GlowReader Skin Analysis! ✨
        
        ### Discover Your Unique Beauty Profile!
        
        Hey gorgeous! I am SO excited to dive into your personalized skin analysis...
        (The rest of the markdown response follows here)
        ---
        
        **YOUR TASK NOW: Generate the full response for the user following the structure above.**

        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;

        // --- UPDATED AND IMPROVED PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI makeup artist and the user's new best friend. Your persona is super fun, witty, supportive, and incredibly talented, like a top beauty guru you'd see on TikTok or Instagram. Embody "Main Character Energy" and get the user hyped for their event. Your tone is vibrant, inspiring, and conversational. Use fun emojis where appropriate and AVOID robotic or overly formal language.

        Here is the user's information:
        - Event/Occasion: "${eventType}"
        - Dress/Outfit Type: "${dressType}"
        - Dress/Outfit Color: "${dressColor}"
        - User Style Preference: "${userStylePreference}"

        Analyze the provided image for skin tone (Warm/Cool/Neutral) and facial features. Craft a complete, step-by-step personalized makeup look.

        **Format the response strictly in Markdown, using clear, inviting headings for sections.**
        `;
    } else {
        return res.status(400).json({ error: 'Invalid mode specified.' });
    }

    try {
        const contentsParts = [{ text: textPromptString }, imagePart];
        const result = await model.generateContent({
            contents: [{ parts: contentsParts }],
            safetySettings,
        });
        const response = await result.response;
        const markdownResponse = response.text();
        res.json({ markdown: markdownResponse });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({
            error: 'Failed to get analysis from AI.',
            details: error.message
        });
    }
});

// --- SERVER START ---
const server = app.listen(PORT, () => {
  console.log(`--- SUCCESS! Server is running on port ${PORT} ---`);
});

server.on('error', (error) => {
  console.error('--- SERVER FAILED TO START ---', error);
});