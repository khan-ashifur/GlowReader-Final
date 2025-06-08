// --- FULL server.js CODE ---

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
    // ... other settings
];

function fileToGenerativePart(buffer, mimeType) {
    return {
      inlineData: { data: buffer.toString('base64'), mimeType },
    };
}

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
        // --- UPDATED PROMPT FOR SKIN ANALYZER ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert... (Your persona instructions remain the same)

        Here is the user's information:
        - User Skin Type: "${skinType}"
        - User Skin Concern: "${skinProblem}"
        - User Age Group: "${ageGroup}"
        - User Lifestyle Factor: "${lifestyleFactor}"

        ... (Analysis instructions remain the same) ...

        #### 🌿 Your Personalized Skincare Revelation:
        * ... (Identified Concern, Root Cause, etc. remain the same) ...
        * **Glow-Getter Product Suggestion:** Instead of a fictional brand, suggest a generic but specific product type that directly addresses the user's primary concern. The suggestion MUST be wrapped in special tags like this: <product>a hydrating hyaluronic acid serum</product> or <product>a gentle salicylic acid cleanser</product>. DO NOT use a fictional brand name.
            * **Description:** [Provide a short, enticing product description of the product TYPE].
        
        ... (Rest of the prompt remains the same) ...
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // --- UPDATED PROMPT FOR MAKEUP ARTIST ---
        textPromptString = `
        You are "Aura," a world-class AI makeup artist... (Your persona instructions remain the same)

        ... (User info and analysis instructions remain the same) ...

        #### 🛍️ Your Curated Glow-Up Collection (Product Type Inspiration):
        This section should suggest generic product types, NOT fictional brands. For key items like Foundation, Eyeshadow, and Lipstick, wrap the suggestion in special <product> tags. For example: <product>a luminous-finish liquid foundation</product> or <product>a warm-toned neutral eyeshadow palette</product>.
        
        * **Primer:** [Suggest a type, e.g., "A pore-minimizing silicone primer"]
        * **Foundation:** [Suggest a type wrapped in tags, e.g., "<product>a medium-coverage satin-finish foundation</product>"]
            * **Description:** [Describe the benefits of this type of foundation].
        * **Concealer:** [Suggest a type, e.g., "A creamy, hydrating concealer"]
        * **Eyeshadow Palette:** [Suggest a type wrapped in tags, e.g., "<product>a palette with shimmering golds and deep plum shades</product>"]
            * **Description:** [Describe why these colors work for the look].
        * ... (and so on for other products, adding <product> tags where a link would be useful) ...
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

const server = app.listen(PORT, () => {
  console.log(`--- SUCCESS! Server is running on port ${PORT} ---`);
});

server.on('error', (error) => {
  console.error('--- SERVER FAILED TO START ---', error);
});