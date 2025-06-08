// --- server.js with FINAL TEMPLATE-BASED PROMPT ---

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
    const mode = req.body.mode;
    const photoFile = req.file;

    if (!photoFile) {
        return res.status(400).json({ error: 'No photo uploaded.' });
    }

    let textPromptString;
    const imagePart = fileToGenerativePart(photoFile.buffer, photoFile.mimetype);

    if (mode === 'skin-analyzer') {
        const { skinType, skinProblem, ageGroup, lifestyleFactor } = req.body;
        // --- NEW TEMPLATE-BASED PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and Gen-Z bestie. Your tone is fun, supportive, and knowledgeable.

        User Information:
        - Skin Type: "${skinType}"
        - Main Concern: "${skinProblem}"
        - Age Group: "${ageGroup}"
        - Lifestyle Factor: "${lifestyleFactor}"

        Your Task is to analyze the user's photo and fill out the following template exactly.

        **YOUR RESPONSE MUST FOLLOW THIS EXACT TEMPLATE:**

        \`\`\`json
        {
          "concerns": [
            {"name": "Hydration", "percentage": "[Generate a score 0-100 based on the image]"},
            {"name": "Oiliness", "percentage": "[Generate a score 0-100 based on the image]"},
            {"name": "Pores", "percentage": "[Generate a score 0-100 based on the image]"},
            {"name": "Redness", "percentage": "[Generate a score 0-100 based on the image]"},
            {"name": "Elasticity", "percentage": "[Generate a score 0-100 based on the image]"},
            {"name": "Dark Spots", "percentage": "[Generate a score 0-100 based on the image]"},
            {"name": "Wrinkles", "percentage": "[Generate a score 0-100 based on the image]"},
            {"name": "Acne Breakouts", "percentage": "[Generate a score 0-100 based on the image]"}
          ]
        }
        \`\`\`

        # Your Radiant Glow-Getter Skin Analysis! ✨
        ### Discover Your Unique Beauty Profile!

        [Generate a warm, enthusiastic intro paragraph here. Mention the user's main concern and your guess for their skin undertone based on the image.]

        ### Aura's Analysis Breakdown
        [Here, write a conversational breakdown for the top 3-4 concerns, using the scores you generated above. For example: "Your oiliness is at a manageable 40%, which is great news!"]

        ### Your Personalized AM/PM Skincare Routine
        [Generate the full AM/PM routine here. For each step (Cleanse, Treat, Moisturize, Protect), explain its purpose and recommend a generic product type like 'a gentle foaming cleanser' or 'a vitamin C serum'.]

        ### Aura's Product Picks 💖
        [Generate specific, real-brand product recommendations that fit the generic types you mentioned in the routine. Recommend 2-4 products in total, explaining why each is a good choice in a fun, conversational paragraph.]
        `;
    } else if (mode === 'makeup-artist') {
        // The makeup artist prompt remains unchanged from the last stable version.
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        textPromptString = `
        You are "Aura," a world-class AI makeup artist... (etc.)
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