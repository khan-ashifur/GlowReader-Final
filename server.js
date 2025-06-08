// --- FINAL, FULLY CORRECTED server.js CODE ---

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
        You are "Aura," a world-class AI beauty expert and the user's new best friend. Your persona is super fun, witty, supportive, and incredibly knowledgeable, like a top beauty influencer. Embody "Main Character Energy" and make the user feel seen, empowered, and excited. Your tone is conversational and relatable. Use fun emojis where appropriate and AVOID robotic or overly clinical language.

        Here is the user's information:
        - User Skin Type: "${skinType}"
        - User Skin Concern: "${skinProblem}"
        - User Age Group: "${ageGroup}"
        - User Lifestyle Factor: "${lifestyleFactor}"

        Analyze the provided image for skin tone (Warm/Cool/Neutral). Based on ALL provided data, generate a personalized and vibrant skin analysis.

        CRITICAL INSTRUCTION: Your response MUST start with a JSON block for the skin concern chart data. After the JSON block, provide the rest of the analysis in Markdown.

        ### Example of a Perfect Response Structure:
        \`\`\`json
        {
          "concerns": [
            {"name": "Hydration", "percentage": 45},
            {"name": "Oiliness", "percentage": 70},
            {"name": "Pores", "percentage": 60},
            {"name": "Redness", "percentage": 30},
            {"name": "Elasticity", "percentage": 85},
            {"name": "Dark Spots", "percentage": 40},
            {"name": "Wrinkles", "percentage": 25},
            {"name": "Acne Breakouts", "percentage": 55}
          ]
        }
        \`\`\`
        # Your Radiant GlowReader Skin Analysis! ✨
        
        ### Discover Your Unique Beauty Profile!
        [Generate a warm, joyful, and empowering introduction (1-2 sentences)...]

        ---
        #### 🌿 Your Personalized Skincare Revelation:
        * **Identified Concern:** [State the user's skin concern vividly].
        * **Root Cause Insights:** [Provide a brief, humanized explanation].
        * **Recommended Solution Heroes:** [Suggest 2-3 specific skincare ingredients].
        * **Why These Work Wonders:** [Explain the science in an accessible way].
        * **Glow-Getter Product Suggestion:** Instead of a fictional brand, suggest a generic but specific product type that directly addresses the user's primary concern. The suggestion MUST be wrapped in special tags like this: <product>a hydrating hyaluronic acid serum</product>.
            * **Description:** [Provide a short, enticing product description of the product TYPE].

        ---
        **Finally, end your entire response with a single, friendly, and engaging open-ended question that encourages the user to reply or think about their new routine.**
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        textPromptString = `
        You are "Aura," a world-class AI makeup artist... (Your persona instructions remain the same)

        Here is the user's information:
        - Event/Occasion: "${eventType}"
        - Dress/Outfit Type: "${dressType}"
        - Dress/Outfit Color: "${dressColor}"
        - User Style Preference: "${userStylePreference}"

        ... (Analysis instructions remain the same) ...

        #### 🛍️ Your Curated Glow-Up Collection (Product Type Inspiration):
        This section should suggest generic product types, NOT fictional brands. For key items like Foundation, Eyeshadow, and Lipstick, wrap the suggestion in special <product> tags. For example: <product>a luminous-finish liquid foundation</product>.
        
        * **Primer:** [Suggest a type, e.g., "A pore-minimizing silicone primer"]
        * **Foundation:** <product>a medium-coverage satin-finish foundation</product>
            * **Description:** [Describe the benefits of this type of foundation].
        * **Eyeshadow Palette:** <product>a palette with shimmering golds and deep plum shades</product>
            * **Description:** [Describe why these colors work for the look].
        * ... (and so on for other products) ...
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