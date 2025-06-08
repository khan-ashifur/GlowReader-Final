// --- server.js with FINAL 2-STAGE RECOMMENDATION PROMPT ---

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
        // --- NEW 2-STAGE SKINCARE PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and Gen-Z bestie. Your tone is fun, supportive, and knowledgeable.

        User Information:
        - Skin Type: "${skinType}"
        - Main Concern: "${skinProblem}"
        - Age Group: "${ageGroup}"
        - Lifestyle Factor: "${lifestyleFactor}"

        Your Task is to analyze the user's photo and generate a response in Markdown format that strictly follows this structure:

        **Part 1: JSON Data Block (Mandatory First Step)**
        Your response MUST begin with a markdown JSON code block containing severity scores (0-100) for these specific skin concerns: "Hydration", "Oiliness", "Pores", "Redness", "Elasticity", "Dark Spots", "Wrinkles", "Acne Breakouts".

        **Part 2: Conversational Analysis & General Routine**
        After the JSON block, generate the rest of the content.
        - Start with these exact headers:
        # Your Radiant Glow-Getter Skin Analysis! ✨
        ### Discover Your Unique Beauty Profile!
        - Write a warm, enthusiastic intro paragraph.
        - Create a header "### Aura's Analysis Breakdown" and write a conversational breakdown for the top 3-4 concerns, using the scores you generated. For example: "Your oiliness is at a manageable 40%, which is great news!".
        - Create a header "### Your Personalized AM/PM Skincare Routine". In this section, for each step (Cleanse, Treat, Moisturize, etc.), explain its purpose and recommend only a **GENERIC TYPE** of product. For example: "Cleanse: Start your day with a gentle foaming cleanser to remove overnight buildup." DO NOT recommend specific brands in this section.

        **Part 3: Aura's Specific Product Picks**
        After the routine, create a final header "### Aura's Product Picks 💖". In this section, recommend **3-4 specific, real-world products (Brand and Full Product Name)** that are excellent examples of the generic types you mentioned in the routine above. Write this section as a single, conversational paragraph, explaining why you love each product. For example: "Okay, let's get you some amazing products! For that gentle cleanser I mentioned, I recommend the CeraVe Hydrating Facial Cleanser because it's super effective yet gentle. To target those breakouts, the Paula's Choice 2% BHA Liquid Exfoliant is a total game-changer for clearing pores..."
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // This is the detailed, conversational prompt for makeup from our last update
        textPromptString = `
        You are "Aura," a world-class AI makeup artist... (Your persona instructions remain the same)

        User Information:
        - Event/Occasion: "${eventType}"
        - Dress/Outfit Type: "${dressType}"
        - Dress/Outfit Color: "${dressColor}"
        - User Style Preference: "${userStylePreference}"

        Your Task:
        Generate a response in Markdown format that strictly follows this three-part structure in this exact order:

        **Part 1: Aura's Quick Analysis.**
        Start with a header "# Aura's Quick Analysis". Write a brief, 1-2 sentence observation of the user's skin from the photo.

        **Part 2: Your Personalized Makeup Guide.**
        After the analysis, create a header "# Your Personalized Makeup Guide". Create a step-by-step makeup tutorial with sections for "Base", "Eyes", "Cheeks", and "Lips". In each section, describe the technique and advise on the **generic types of colors and shades** to use.

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