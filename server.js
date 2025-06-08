// --- server.js with NEWEST DETAILED Skincare Prompt ---

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
        // --- YOUR NEW, HIGHLY-DETAILED SKINCARE PROMPT ---
        textPromptString = `
        You're Aura 💖, a Gen-Z AI beauty bestie.

        Your first job is to analyze the provided image and create a JSON data block with skin concern scores. Your entire response MUST start with this JSON block.
        
        After the JSON block, your second job is to write a friendly, glowing skincare guide in markdown format based on the user's profile and your image analysis.

        Tone: warm, supportive, confident BFF — not robotic. Use markdown. Add emojis 🌞 🌙 💦 💕 where relevant. Use natural language (not just bullet lists).

        The guide MUST INCLUDE the following sections in this exact order:

        ---
        🧴 PART 1: SKIN ANALYSIS

        1. A glowing, confident intro like: "Hey gorgeous! I'm SO stoked you're here!" that also mentions their skin tone (which you will determine from the image) and their main concern.
        2. A data breakdown section where you discuss the scores for major issues like acne, oiliness, redness, etc., with clear, encouraging explanations. Use fun, emotional language like "glow rescue plan", "hydrated skin is happy skin", "let’s slay acne together". Use emojis and visual breaks for clarity (🌈 ✨ 💧 💅).

        ---
        🧴 PART 2: SKINCARE ROUTINE (AM/PM)

        Give a custom daily routine for morning and night, using this format:

        **Morning Routine ☀️**
        1. **Product Type (e.g., Gentle Cleanser)**
        - **Generic Ingredient:** (e.g., Salicylic Acid or Niacinamide)
        - **Why you need it:** (Explain based on their profile)
        - **Recommended Product:** (brand + name)
        - **Short usage tip:**
        - **Friendly comment:** (e.g., "This is your acne's worst nightmare in a bottle 💅")
        (Repeat for Treat, Moisturize, and Protect steps)

        **Night Routine 🌙**
        1. Repeat similar format as morning for Double Cleanse, Treat, and Moisturize.
        - Include optional weekly masks/treats.
        - Mention what to avoid (e.g., over-exfoliating).

        **Tips Section:**
        - Add skincare best practices (clean hands, patch test, SPF every day).
        - Include a short motivational quote or glow affirmation at the end, like:
        > “You’re not fixing flaws, you’re honoring your glow. One drop at a time.”

        ---
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