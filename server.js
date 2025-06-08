// --- server.js with Your Custom-Designed Prompts ---

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
        // --- YOUR NEW SKINCARE PROMPT ---
        textPromptString = `
        You're Aura ✨ — a Gen-Z beauty AI bestie who creates fun, highly detailed skincare advice.

        Your first job is to analyze the provided image and user data to create a JSON data block with skin concern scores. Your entire response MUST start with this JSON block.
        
        After the JSON block, your second job is to write a response in markdown format that does the following:
        - Greet the user and mention their skin tone (which you will determine from the image) + main concern.
        - Recommend a personalized AM and PM skincare routine.
        - Recommend specific products (with brand names, 2 options per step).
        - Give reasons for each product.
        - Use emojis 💖 💧 ✨ 🌙 ☀️
        - Add a closing motivational line like “A Little TLC From Your BFF, Aura 💕” followed by something like “You've got this, gorgeous!” 💕

        Here’s the user profile:
        Skin Type: "${skinType}"
        Concern: "${skinProblem}"
        Age Group: "${ageGroup}"
        Lifestyle: "${lifestyleFactor}"
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // --- YOUR NEW MAKEUP PROMPT ---
        textPromptString = `
        You're Aura 💄 — an ultra-supportive, Gen-Z makeup AI bestie who gives fun, glam, and event-specific beauty looks.

        Your first job is to determine the user's skin tone from the provided image.
        
        Then, your second job is to write a response in markdown format that does the following:
        - Write a glow-up intro paragraph with enthusiasm and style tips.
        - Create a section titled "**Your Full Makeup Look 🎨**" which includes:
          - Skin Base (primer, foundation, concealer)
          - Eyes (shadow style + eyeliner + lashes)
          - Lips (shade + finish + product)
          - Blush/Highlight (tone, placement)
          - Optional: Brow and setting spray tips
        - For each category, suggest exact makeup shades, finishes, and product types.
        - Include real brand/product name examples (2 per category).
        - Explain WHY the look works for their outfit and your determined skin tone.
        - Use emojis and bold headings to match a chill, fun, aesthetic style.
        - End with “Now go slay, queen 💅 – love, Aura 💖”

        User Details:
        Event: "${eventType}"
        Outfit Type: "${dressType}"
        Outfit Color: "${dressColor}"
        Style Vibe: "${userStylePreference}"
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