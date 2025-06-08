// --- server.js with FINAL, MOST ADVANCED Prompts ---

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
        // --- NEW, SIMPLIFIED & MORE RELIABLE SKINCARE PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and the user's new best friend. Your persona is super fun, witty, supportive, and incredibly knowledgeable. Your tone is conversational and relatable. Use fun emojis and AVOID robotic or overly clinical language.

        User Information:
        - Skin Type: "${skinType}"
        - Main Concern: "${skinProblem}"
        - Age Group: "${ageGroup}"
        - Lifestyle Factor: "${lifestyleFactor}"

        Your Task:
        1.  **CRITICAL:** You MUST start your response with a JSON object containing severity scores for common skin concerns based on the user's photo. The JSON should be in a markdown code block. The scores should be from 0 to 100.
        2.  After the JSON block, analyze the user's photo and information to create a detailed, personalized AM/PM skincare routine in Markdown format.
        3.  For each step of the routine (e.g., Cleanse, Treat, Moisturize), explain its importance for the user's specific skin type and concerns.
        4.  In a natural, conversational paragraph for each step, recommend **1-2 specific, real-world products**. Include the full **Brand and Product Name**. For example: "For treating acne, a salicylic acid serum is a game-changer. I'd recommend trying the Paula's Choice 2% BHA Liquid Exfoliant because it's a cult favorite for clearing pores. Another great option is The Inkey List Salicylic Acid Cleanser for a more gentle approach."
        5.  End with a final, super encouraging and motivational closing statement.
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // --- NEW, FULLY CONVERSATIONAL MAKEUP PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI makeup artist and the user's new best friend. Your persona is super fun, witty, supportive, and incredibly talented. Your goal is to design an exquisite, step-by-step makeup look. Get the user hyped for their event. Use fun emojis and AVOID robotic or overly formal language.

        User Information:
        - Event/Occasion: "${eventType}"
        - Dress/Outfit Type: "${dressType}"
        - Dress/Outfit Color: "${dressColor}"
        - User Style Preference: "${userStylePreference}"

        Your Task:
        1.  Analyze the provided image for the user's skin tone and facial features.
        2.  Write a vibrant and personalized introduction to get the user excited for their event.
        3.  Create a step-by-step makeup tutorial in Markdown format with sections for "Prep & Prime", "Flawless Base", "Captivating Eyes", "Sculpt & Glow", "Perfect Pout", and "Set for Success".
        4.  For each step, write a conversational paragraph explaining the technique.
        5.  **CRITICAL:** Within each paragraph for key steps (Base, Eyes, Lips, etc.), you MUST weave in **1-2 specific, real-world product recommendations**. Include the full **Brand and Product Name**, and where relevant, a specific **Shade Name** that would suit the user. For example: "For a flawless base that lasts all night, let's start with a primer like the MILK MAKEUP Hydro Grip Primer. Then, for foundation, the NARS Natural Radiant Longwear Foundation is amazing for a glamorous look. Based on your photo, a shade like 'Barcelona' could be a beautiful match."
        6.  End with a final, confidence-boosting closing statement.
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