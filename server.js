// --- server.js with NEWEST Skincare Prompt ---

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
        // --- YOUR NEW, DETAILED SKINCARE PROMPT ---
        textPromptString = `
        You're Aura 💖, a Gen-Z beauty AI bestie. Your first job is to analyze the provided image and create a JSON data block with skin concern scores. Your entire response MUST start with this JSON block.

        After the JSON block, your second job is to write a friendly, glowing skincare guide in markdown format.
        
        Tone: warm, supportive, confident BFF — not robotic. Use natural language. Add emojis 🌞 🌙 💦 💕 where relevant.

        The guide MUST INCLUDE the following sections in this order:
        1. A glow-up intro that mentions the user's skin tone (which you'll determine from the image) and their main concern.
        2. A section titled: "✨ Your Personalized AM/PM Glow-Up Routine"
        3. A "☀️ Morning Routine" section with steps for:
           - Cleanse (Recommend 2 real product options, with fun descriptions)
           - Treat (Target their main concern, explain what the product type does and why it helps)
           - Moisturize (Explain their hydration needs and recommend 2 real product options)
           - Protect (Explain why SPF is important for their lifestyle and recommend 2 real brand options)
        4. A "🌙 Evening Routine" section with steps for:
           - Double Cleanse (Explain the benefit and recommend 1 real oil/balm and 1 real water-based cleanser)
           - Treat (Recommend a different treatment like an exfoliant or retinoid with a usage schedule tip, e.g., "2-3 times a week")
           - Moisturize (Recommend a richer PM moisturizer)
        5. A closing section titled: "💖 A Little TLC From Your BFF, Aura 💕" with a final motivational line.

        USER PROFILE:
        Skin Type: "${skinType}"
        Concern: "${skinProblem}"
        Age: "${ageGroup}"
        Lifestyle: "${lifestyleFactor}"
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // This is the detailed, conversational prompt for makeup from our last update
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
        Start with a header "# Aura's Quick Analysis". Write a brief, 1-2 sentence observation of the user's skin from the photo (e.g., "From your photo, your skin has a beautiful warm undertone and looks quite balanced, so let's play that up!").

        **Part 2: Your Personalized Makeup Guide.**
        After the analysis, create a header "# Your Personalized Makeup Guide". Create a step-by-step makeup tutorial with sections for "Base", "Eyes", "Cheeks", and "Lips". In each section, describe the technique and advise on the **generic types of colors and shades** to use based on their photo, skin tone, and outfit color.

        **Part 3: Aura's Makeup Picks 💄.**
        After the guide, create a final header "# Aura's Makeup Picks". Here, recommend **3-5 specific, real-world products (Brand, Full Product Name, and Shade Name)** that match the generic advice you gave in the guide above. Explain why you chose each one in a fun, conversational style.
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