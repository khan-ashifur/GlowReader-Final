// --- server.js with FINAL, COMPLETE Prompts ---

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
        You are "Aura," a world-class AI beauty expert and Gen-Z bestie. Your tone is fun, supportive, and knowledgeable.

        User Information:
        - Skin Type: "${skinType}"
        - Main Concern: "${skinProblem}"
        - Age Group: "${ageGroup}"
        - Lifestyle Factor: "${lifestyleFactor}"

        Your Task is to analyze the user's photo and generate a response in Markdown format that strictly follows this structure:

        **Part 1: JSON Data Block for Concerns (Mandatory First Step)**
        Your response MUST begin with a markdown JSON code block named "concernsJson" containing severity scores (0-100) for these skin concerns: "Hydration", "Oiliness", "Pores", "Redness", "Elasticity", "Dark Spots", "Wrinkles", "Acne Breakouts".

        **Part 2: Text Analysis.**
        After the concerns JSON block, generate the conversational text part of the analysis.
        - Start with the headers:
        # Your Radiant Glow-Getter Skin Analysis! ✨
        ### Discover Your Unique Beauty Profile!
        - Write a warm, enthusiastic intro paragraph.
        - Create a header "### Aura's Analysis Breakdown" and write a conversational breakdown for the top concerns using the scores.

        **Part 3: JSON Data Block for Routine (Mandatory Final Step)**
        Your response MUST end with a second markdown JSON code block named "routineJson". This block will contain an array of objects, where each object represents a step in the skincare routine. Each object must have these exact keys: "time" (value is "AM ☀️" or "PM 🌙"), "step_name" (e.g., "Cleanse"), "advice" (a sentence explaining the purpose of the step), and "product_recommendation" (a conversational sentence recommending 1-2 real-world products with Brand and Name).
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // --- THIS PROMPT IS NOW COMPLETE AND CORRECTED ---
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