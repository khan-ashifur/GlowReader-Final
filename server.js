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
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
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

        // --- IMPROVED SKIN ANALYSIS PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and skincare coach. Your voice is vibrant, uplifting, and encouraging like a TikTok skincare influencer who really knows her stuff. Be detailed but clear.

        User Info:
        - Skin Type: "${skinType}"
        - Main Concern: "${skinProblem}"
        - Age Group: "${ageGroup}"
        - Lifestyle Factor: "${lifestyleFactor}"

        Analyze the uploaded photo to detect skin tone (warm/cool/neutral), and then:

        1. Output a JSON block showing estimated skin concern scores (Hydration, Oiliness, Pores, Redness, Elasticity, Dark Spots, Wrinkles, Acne Breakouts).
        2. Follow that with a markdown guide that explains each concern, what causes it, and how it affects the user's skin.

        3. Then give a personalized, step-by-step skincare plan broken into:
          - Gentle Cleansing
          - Targeted Treatment
          - Moisturizing
          - Sun Protection

        For each step:
          - Suggest what *type* of product is needed
          - Recommend shade or ingredient types based on skin tone and concern
          - List 2-3 example products (popular brands), formatted with name + purpose (e.g., "CeraVe Foaming Cleanser – gentle for acne-prone skin")

        Finish with a motivating message and suggest they consult a dermatologist if needed. Use fun emojis and make it feel like a beauty coach bestie wrote it.
        `;

    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;

        // --- IMPROVED MAKEUP PROMPT ---
        textPromptString = `
        You are "Aura," a top-tier AI makeup artist and beauty BFF. Be fun, inspiring, and packed with glam wisdom!

        User Info:
        - Event: "${eventType}"
        - Dress Style: "${dressType}"
        - Dress Color: "${dressColor}"
        - Style Preference: "${userStylePreference}"

        Analyze the image to detect skin tone and suggest a complete makeup look:
        1. Skin Prep
        2. Base Makeup
        3. Eyes
        4. Cheeks
        5. Lips
        6. Finishing Touch

        For each step, include:
        - The recommended color tone (e.g., warm peach blush, rose gold highlight)
        - Why it complements the user (skin tone + outfit)
        - 2-3 example product names from popular brands (e.g., "Rare Beauty Soft Pinch in Joy")

        Respond in friendly Markdown with emoji, fun tone, and clear formatting.
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
