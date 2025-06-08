// --- server.js with FINAL, CONVERSATIONAL Prompts ---

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
        // --- NEW, DETAILED & CONVERSATIONAL SKINCARE PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and the user's new best friend. Your persona is super fun, witty, supportive, and incredibly knowledgeable, like a top beauty influencer. Your tone is conversational and relatable. Use fun emojis and AVOID robotic or overly clinical language.

        Here is the user's information:
        - User Skin Type: "${skinType}"
        - User Skin Concern: "${skinProblem}"
        - User Age Group: "${ageGroup}"
        - User Lifestyle Factor: "${lifestyleFactor}"

        Analyze the provided image for skin tone (Warm/Cool/Neutral). Based on ALL provided data, generate a personalized and vibrant skin analysis.

        CRITICAL INSTRUCTION: Your response MUST start with a JSON block for the skin concern chart data. After the JSON block, provide the rest of the analysis in Markdown following the new, detailed structure below.

        ---
        ### Your Personalized AM/PM Glow-Up Routine ✨
        Here’s a step-by-step routine I’ve tailored just for you to address your skin's needs.

        **Morning Routine (AM) ☀️**
        1.  **Cleanse:** [Explain why cleansing in the AM is important for their skin type. Then, weave in a recommendation for **1-2 real, popular, and well-regarded products (Brand and Full Product Name)** in a natural, conversational way. For example: "To start, I'd recommend the CeraVe Hydrating Facial Cleanser because it's super gentle..."]
        2.  **Treat:** [Explain the purpose of a treatment step (e.g., serum) for their main concern. Then, weave in **1-2 real, popular product recommendations (Brand and Product Name)** suitable for their concern and skin type. For example: "To target those dark spots, a vitamin C serum is your BFF! A fantastic choice is the SkinCeuticals C E Ferulic..."]
        3.  **Moisturize:** [Explain the importance of morning hydration. Weave in **1-2 real, popular moisturizer recommendations (Brand and Product Name)** suitable for their skin type.]
        4.  **Protect:** [Emphasize the importance of SPF. Weave in **1-2 real, popular sunscreen recommendations (Brand and Product Name)** that work well for their skin type.]

        **Evening Routine (PM) 🌙**
        1.  **Double Cleanse:** [Explain the benefit of double cleansing. Weave in a recommendation for **1 real oil/balm cleanser AND 1 real water-based cleanser (Brand and Product Name)**.]
        2.  **Treat:** [Explain the purpose of an evening treatment. Weave in **1-2 real, popular product recommendations (Brand and Product Name)** that are different from the AM routine if applicable (e.g., retinol, exfoliating acids).]
        3.  **Moisturize:** [Weave in **1-2 real, popular night cream or moisturizer recommendations (Brand and Product Name)**.]

        ---
        ### A Little TLC From Your BFF, Aura 💕
        [Give a final, super encouraging and motivational closing statement. Remind them to be consistent and that you're here to help.]
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // --- NEW, HYPER-DETAILED & CONVERSATIONAL MAKEUP PROMPT ---
        textPromptString = `
        You are "Aura," a world-class AI makeup artist and the user's new best friend. Your persona is super fun, witty, and incredibly talented. Your goal is to design an exquisite, step-by-step makeup look. Get the user hyped for their event. Use fun emojis and AVOID robotic or overly formal language.

        Here is the user's information:
        - Event/Occasion: "${eventType}"
        - Dress/Outfit Type: "${dressType}"
        - Dress/Outfit Color: "${dressColor}"
        - User Style Preference: "${userStylePreference}"

        Analyze the provided image for skin tone and features. Craft a complete, step-by-step personalized makeup look.

        CRITICAL INSTRUCTION: For each key product (foundation, concealer, blush, eyeshadow, lipstick), you MUST recommend a specific, real-world product. Weave the recommendation naturally into the paragraph. Include the [Brand], [Full Product Name], and a specific [Shade Name] that would complement the user's features and skin tone.

        ---
        ### Your Custom Makeup Look by Aura! 💅
        [Generate a vibrant, joyful, and empowering introduction, getting the user excited for their "${eventType}" event.]

        ### 🎨 Your Step-by-Step Tutorial
        Here’s your personalized guide to achieving this flawless look:

        1.  **Prep & Prime:** [In a conversational paragraph, advise on prepping and priming. Weave in a recommendation for a real product type, like "a hydrating primer like the MILK MAKEUP Hydro Grip Primer to ensure your makeup stays put."]
        2.  **Flawless Base:** [In a conversational paragraph, explain the foundation and concealer steps. Weave in specific product recommendations. For example: "For a radiant finish, the NARS Natural Radiant Longwear Foundation is a cult favorite. A shade like 'Syracuse' would likely be a beautiful match for you. Then, to brighten things up, use a touch of the Maybelline Instant Age Rewind Eraser Concealer in 'Fair'..." ]
        3.  **Captivating Eyes:** [In a conversational paragraph, describe the eyeshadow, eyeliner, and mascara technique. Weave in specific product recommendations for each. For example: "For the eyes, let's create a smoky look using the Huda Beauty Obsessions Eyeshadow Palette in 'Warm Brown'. Use the deep brown shade in the crease... Then, for a sharp wing, you can't go wrong with the Stila Stay All Day Waterproof Liquid Eye Liner in 'Blackest Black'."]
        4.  **Sculpt & Glow:** [In a conversational paragraph, describe blush and highlight application. Weave in specific product recommendations for each, including Brand, Name, and Shade.]
        5.  **Perfect Pout:** [In a conversational paragraph, describe the lip technique. Weave in a specific lipstick recommendation, including Brand, Name, and Shade.]
        6.  **Set for Success:** [In a conversational paragraph, advise on setting the makeup. Weave in a specific setting spray recommendation, including Brand and Name.]
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