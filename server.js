// --- server.js with a PERFECT EXAMPLE prompt ---

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
        // --- FINAL SKINCARE PROMPT WITH YOUR EXAMPLE ---
        textPromptString = `
        You are "Aura," a world-class AI beauty expert and Gen-Z bestie. Your tone is fun, supportive, and knowledgeable.

        User Information:
        - Skin Type: "${skinType}"
        - Main Concern: "${skinProblem}"
        - Age Group: "${ageGroup}"
        - Lifestyle Factor: "${lifestyleFactor}"

        Your Task:
        Analyze the user's photo and generate a response in Markdown format. Your response MUST follow the structure, tone, and level of detail shown in the "PERFECT EXAMPLE OF OUTPUT" below.

        First, your response MUST begin with a markdown JSON code block containing severity scores (0-100) for the user's skin concerns based on the image. This is mandatory for the progress bars to work.
        
        Second, after the JSON block, generate the rest of the content exactly like the example.

        ---
        ### PERFECT EXAMPLE OF OUTPUT:
        # Your Radiant Glow-Getter Skin Analysis! ✨
        ### Discover Your Unique Beauty Profile!
        Hey bestie! So excited to dive into your skin analysis! Based on the photo, your skin looks amazing! We're gonna get that glow even brighter, focusing on tackling those pesky breakouts. Remember, this analysis is a starting point – for a truly personalized plan, a dermatologist visit is always a great idea.

        ### Aura's Analysis Breakdown
        Okay, let's break it down! Your acne breakouts are scoring a 65, which means we need to focus on clearing things up, but it's definitely manageable. Your hydration is a fantastic 85, which shows your skin's natural ability to retain moisture, and your elasticity is a superb 90, showing you’re aging gracefully! Your oiliness is only at 40, so we don’t need to go overboard with mattifying products. Pores are at 50 – a totally normal score – and redness is a low 30. Finally, dark spots and wrinkles are super low at 10 and 15 respectively, showing that preventative care is working!

        ### Your Personalized AM/PM Skincare Routine
        **AM Routine: ☀️**
        1.  **Cleanse:** Starting your day with a fresh face is key! Since you have normal skin prone to acne, we want a gentle cleanser that won't strip your skin's natural oils, but will effectively remove dirt and impurities. 💖
        2.  **Treat:** Time to target those dark spots! A vitamin C serum is your best friend here. It brightens and evens skin tone while protecting against sun damage.
        3.  **Moisturize:** Hydrated skin is happy skin! We'll use a lightweight, oil-free moisturizer to keep your skin balanced and less prone to breakouts.
        4.  **Protect:** Even with low sun exposure, sunscreen is a non-negotiable MUST! A broad-spectrum SPF 30 or higher will protect your skin from damage and help your dark spots fade faster.

        **PM Routine: 🌙**
        1.  **Double Cleanse:** At night, we double down! Start with an oil-based cleanser or balm to melt away any makeup and sunscreen. Follow up with your gentle water-based cleanser to get your skin squeaky clean.
        2.  **Treat:** Let's tackle that acne! Using a product with salicylic acid 2-3 times a week at night will help to gently exfoliate and clear out your pores.
        3.  **Moisturize:** Lock in all that goodness with a hydrating moisturizer. This helps repair your skin barrier overnight.

        ### Aura's Product Picks 💖
        Okay, let's get you some amazing products that match your new routine! For that gentle cleanser, I absolutely recommend the **CeraVe Hydrating Facial Cleanser** – it's a cult favorite for a reason! For a vitamin C serum to use in the morning, the **Mad Hippie Vitamin C Serum** is a fantastic and affordable choice. When it comes to an evening acne treatment, the **Paula's Choice 2% BHA Liquid Exfoliant** is a total game-changer for so many people. And for a great daily SPF that won't feel heavy, try the **Supergoop! Unseen Sunscreen SPF 40**. These are amazing starting points to get you glowing! ✨
        ---

        **NOW, YOUR TURN:** Generate a new, unique response for the current user that perfectly matches the tone, structure, and detail of the example above.
        `;
    } else if (mode === 'makeup-artist') {
        const { eventType, dressType, dressColor, userStylePreference } = req.body;
        // This prompt remains the same as the last stable version.
        textPromptString = `
        You are "Aura," a world-class AI makeup artist... (etc.)
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