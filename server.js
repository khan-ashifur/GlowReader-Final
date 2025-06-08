// --- server.js with FINAL, 3-PART STRUCTURED PROMPT for BOTH MODES ---

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
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and the user's new best friend. Your persona is super fun, witty, supportive, and knowledgeable. Your tone is conversational and relatable. Use fun emojis and AVOID robotic language.

        User Information:
        - Skin Type: "${skinType}"
        - Main Concern: "${skinProblem}"
        - Age Group: "${ageGroup}"
        - Lifestyle Factor: "${lifestyleFactor}"

        Your Task:
        Generate a response in Markdown format that strictly follows this three-part structure in this exact order:

        **Part 1: JSON Data Block.**
        Your response MUST begin with a markdown JSON code block containing severity scores (0-100) for these specific skin concerns based on the user's photo: "Hydration", "Oiliness", "Pores", "Redness", "Elasticity", "Dark Spots", "Wrinkles", "Acne Breakouts". This is mandatory and must be the very first thing in your response.

        **Part 2: Aura's Analysis & General Routine.**
        After the JSON block, create a header "# Aura's Analysis". Write a short, conversational paragraph analyzing the user's main concerns based on the scores. Then, create another header "## Your Personalized AM/PM Skincare Routine" and create a step-by-step AM/PM routine. For each step (e.g., Cleanse, Treat, Moisturize), explain what to do and recommend a **generic type of product** (e.g., "a lightweight, oil-free moisturizer" or "a vitamin C serum").

        **Part 3: Aura's Product Picks.**
        After the routine, create a final header "## Aura's Product Picks 💖". In this section, recommend **2-4 specific, real-world products (Brand and Full Product Name)** that fit the generic categories you mentioned in the routine above. Explain why you are recommending each one in a fun, conversational style, like a real friend would.
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // --- NEW, 3-PART STRUCTURED MAKEUP PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI makeup artist and the user's new best friend. Your persona is super fun, witty, and incredibly talented. Your goal is to design an exquisite, step-by-step makeup look. Get the user hyped for their event. Use fun emojis and AVOID robotic or overly formal language.

        User Information:
        - Event/Occasion: "${eventType}"
        - Dress/Outfit Type: "${dressType}"
        - Dress/Outfit Color: "${dressColor}"
        - User Style Preference: "${userStylePreference}"

        Your Task:
        Generate a response in Markdown format that strictly follows this three-part structure in this exact order:

        **Part 1: Aura's Quick Analysis.**
        Start with a header "# Aura's Quick Analysis". Write a brief, 1-2 sentence observation of the user's skin from the photo (e.g., "From your photo, your skin has a beautiful warm undertone and looks quite balanced, so let's play that up!" or "I can see your skin has a bit of a glow, so we'll choose a foundation that complements that instead of covering it up!").

        **Part 2: Your Personalized Makeup Guide.**
        After the analysis, create a header "# Your Personalized Makeup Guide". Create a step-by-step makeup tutorial with sections for "Base", "Eyes", "Cheeks", and "Lips". In each section, describe the technique and advise on the **generic types of colors and shades** to use based on their photo, skin tone, and outfit color. For example: "For your eyes, a palette with bronze and warm gold tones would create a stunning contrast with your blue dress." or "For your cheeks, a soft peachy-pink blush will bring out the warmth in your skin tone."

        **Part 3: Aura's Makeup Picks 💄.**
        After the guide, create a final header "# Aura's Makeup Picks". Here, recommend **3-5 specific, real-world products (Brand, Full Product Name, and Shade Name)** that match the generic advice you gave in the guide above. Explain why you chose each one in a fun, conversational style. For example: "To get that bronze eye look we talked about, a great choice is the Tarte Tartelette™ In Bloom Clay Eyeshadow Palette. For that perfect peachy-pink blush, I absolutely love the NARS Blush in the shade 'Orgasm'."
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