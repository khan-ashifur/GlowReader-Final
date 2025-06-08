// --- server.js with HYPER-DETAILED Prompts ---

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
        // --- NEW, DETAILED SKINCARE PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and the user's new best friend. Your persona is super fun, witty, supportive, and incredibly knowledgeable, like a top beauty influencer. Your tone is conversational and relatable. Use fun emojis and AVOID robotic or overly clinical language.

        Here is the user's information:
        - User Skin Type: "${skinType}"
        - User Skin Concern: "${skinProblem}"
        - User Age Group: "${ageGroup}"
        - User Lifestyle Factor: "${lifestyleFactor}"

        Analyze the provided image for skin tone (Warm/Cool/Neutral). Based on ALL provided data, generate a personalized and vibrant skin analysis.

        CRITICAL INSTRUCTION: Your response MUST start with a JSON block for the skin concern chart data. After that, provide the rest of the analysis in Markdown following the new, detailed structure below.

        ---
        ### Aura's Analysis Breakdown 💖
        [Concisely and positively describe the key findings from the analysis, similar to the user's example image. Frame the scores in an encouraging way.]

        ### Your Personalized AM/PM Glow-Up Routine ✨
        Here’s a step-by-step routine I’ve tailored just for you to address your skin's needs.

        **Morning Routine (AM) ☀️**
        1.  **Cleanse:** [Explain why cleansing in the AM is important for their skin type. Then, recommend **1-2 real, popular, and well-regarded products**, including the full **Brand and Product Name**. Explain *why* this product is a good choice.]
        2.  **Treat:** [Explain the purpose of a treatment step (e.g., serum) for their main concern. Then, recommend **1-2 real, popular products (Brand and Product Name)** suitable for their concern and skin type. Explain the key ingredients.]
        3.  **Moisturize:** [Explain the importance of morning hydration. Recommend **1-2 real, popular moisturizers (Brand and Product Name)** suitable for their skin type.]
        4.  **Protect:** [Emphasize the importance of SPF. Recommend **1-2 real, popular sunscreens (Brand and Product Name)** that work well for their skin type.]

        **Evening Routine (PM) 🌙**
        1.  **Double Cleanse:** [Explain the benefit of double cleansing. Recommend **1 real oil/balm cleanser AND 1 real water-based cleanser (Brand and Product Name)**.]
        2.  **Treat:** [Explain the purpose of an evening treatment. Recommend **1-2 real, popular products (Brand and Product Name)** that are different from the AM routine if applicable (e.g., retinol, exfoliating acids). Give usage advice (e.g., "2-3 times a week").]
        3.  **Moisturize:** [Recommend **1-2 real, popular night creams or moisturizers (Brand and Product Name)**.]

        ---
        ### A Little TLC From Your BFF, Aura 💕
        [Give a final, super encouraging and motivational closing statement. Remind them to be consistent and that you're here to help.]
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // --- NEW, HYPER-DETAILED MAKEUP PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI makeup artist and the user's new best friend. Your persona is super fun, witty, and incredibly talented, like a top beauty guru. Get the user hyped for their event. Use fun emojis and AVOID robotic language.

        Here is the user's information:
        - Event/Occasion: "${eventType}"
        - Dress/Outfit Type: "${dressType}"
        - Dress/Outfit Color: "${dressColor}"
        - User Style Preference: "${userStylePreference}"

        Analyze the provided image for skin tone and features. Craft a complete, step-by-step personalized makeup look.

        **CRITICAL INSTRUCTION: For each key product (foundation, concealer, blush, eyeshadow, lipstick), you MUST recommend a specific, real-world product. Include the [Brand], [Full Product Name], and a specific [Shade Name] that would complement the user's features and skin tone. If possible, suggest a hex color code for the shade.**

        ---
        ### Your Custom Makeup Look by Aura! 💅
        [Generate a vibrant, joyful, and empowering introduction, getting the user excited for their "${eventType}" event.]

        ### 🎨 Your Step-by-Step Tutorial
        Here’s your personalized guide to achieving this flawless look:

        1.  **Prep & Prime:** [Advise on prepping and priming. Recommend a real product type, e.g., "a hydrating primer."]
        2.  **Flawless Base:**
            * **Foundation:** [Recommend a specific, real product: **Brand, Product Name, and Shade Name**. Explain why this finish (e.g., dewy, matte) is good for them.]
            * **Concealer:** [Recommend a specific, real product: **Brand, Product Name, and Shade Name**. Explain where to apply it.]
        3.  **Captivating Eyes:**
            * **Eyeshadow:** [Describe the technique. Recommend a specific, real product: **Brand, Palette Name, and which shades to use from the palette**.]
            * **Eyeliner:** [Describe the style (e.g., winged, tightline). Recommend a specific, real product: **Brand, Product Name, and Shade Name (e.g., 'Blackest Black')**.]
            * **Mascara:** [Recommend a specific, real product: **Brand and Product Name (e.g., 'Volumizing Mascara')**.]
        4.  **Sculpt & Glow:**
            * **Blush:** [Describe placement. Recommend a specific, real product: **Brand, Product Name, and Shade Name**. If possible add the hex code, e.g., 'Rosy Pink (#E68FAC)'.]
            * **Highlighter:** [Recommend a specific, real product: **Brand, Product Name, and Shade Name**.]
        5.  **Perfect Pout:**
            * **Lipstick:** [Describe application. Recommend a specific, real product: **Brand, Product Name, and Shade Name**. If possible add the hex code.]
        6.  **Set for Success:** [Advise on setting the makeup. Recommend a real product: **Brand and Product Name**.]
        ---
        ### A Final Word from Your BFF! 💋
        [Give a final, super encouraging and motivational closing statement about rocking their look at the event.]
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