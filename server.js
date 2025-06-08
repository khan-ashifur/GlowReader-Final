// server.js - FINAL Version: Skin Analyzer (Dynamic Welcomes) & Makeup Artist (Event-based Prompts)

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


const PORT = 3000;

const API_KEY = process.env.GOOGLE_API_KEY; 
if (!API_KEY) {
    console.error('ERROR: GOOGLE_API_KEY not found in .env file!');
    process.exit(1); 
}
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

function fileToGenerativePart(buffer, mimeType) {
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      },
    };
}


// --- ROUTES ---

app.get('/', (req, res) => {
    console.log('Request received for the "/" route. Serving index.html.');
});

app.get('/get-chat-data', (req, res) => {
    console.log('Request received for "/get-chat-data" route.');
    const dummyChatData = {
        last_interaction: "This data will eventually come from your chat history storage.",
        recent_recommendations: [
            "This is a placeholder for previous recommendations.",
        ],
        user_profile_summary: "Placeholder for user profile data."
    };
    res.json(dummyChatData); 
});

app.post('/api/vision', upload.single('photo'), async (req, res) => {
    console.log('Request received for /api/vision (POST)');

    const mode = req.body.mode; 
    const photoFile = req.file; 

    if (!photoFile) {
        return res.status(400).json({ error: 'No photo uploaded.' });
    }

    let textPromptString; 
    const imagePart = fileToGenerativePart(photoFile.buffer, photoFile.mimetype);
    let contentsParts = []; 


    if (mode === 'skin-analyzer') {
        const skinType = req.body.skinType; 
        const skinProblem = req.body.skinProblem; 
        const ageGroup = req.body.ageGroup; 
        const lifestyleFactor = req.body.lifestyleFactor; 

        textPromptString = `
You are an exceptionally engaging, warm, and professional beauty AI assistant, specialized in skin analysis. Your responses should feel like they're coming from a very knowledgeable and friendly expert. Use a rich and varied vocabulary. Avoid repetitive phrasing. Infuse excitement and encouragement where appropriate. Focus on a happy, joyful, motivational tone, specifically tailored for girls/women seeking skincare advice.

Here is the user's information:
- User Skin Type: "${skinType}"
- User Skin Concern: "${skinProblem}"
- User Age Group: "${ageGroup}"
- User Lifestyle Factor: "${lifestyleFactor}"

Analyze the provided image for skin tone (Warm/Cool/Neutral), identifying specific characteristics.
Based on all the provided information (image, skin type, skin concern, age group, lifestyle factor), generate a truly personalized and vibrant skin analysis and beauty roadmap.

**Format the response strictly in Markdown, using clear, inviting headings for sections, and adhere to this exact order.**
**For the skin tone explanation, provide a direct, confident description of the detected tone, do not comment on the image quality or confidence level.**
**Ensure your language is enthusiastic and supportive throughout.**
**Include a JSON block at the beginning of the Markdown output that contains a list of common skin concerns and their estimated percentage levels (0-100). These percentages represent a severity score for that concern.**
**The JSON block should be enclosed in triple backticks and start with 'json' like this:**
\`\`\`json
{
  "concerns": [
    {"name": "Hydration", "percentage": [0-100]},
    {"name": "Oiliness", "percentage": [0-100]},
    {"name": "Pores", "percentage": [0-100]},
    {"name": "Redness", "percentage": [0-100]},
    {"name": "Elasticity", "percentage": [0-100]},
    {"name": "Dark Spots", "percentage": [0-100]},
    {"name": "Wrinkles", "percentage": [0-100]},
    {"name": "Acne Breakouts", "percentage": [0-100]}
  ]
}
\`\`\`

# Your Radiant GlowReader Skin Analysis! ✨

### Discover Your Unique Beauty Profile!

[Generate a warm, joyful, and empowering introduction (1-2 sentences) for a girl/woman, specifically mentioning the excitement of starting their beauty journey and how this analysis will help them. Incorporate their skin type and concern naturally.]

Your skin tone truly shines with a **[Detected Skin Tone]** undertone [Emoji relevant to tone, e.g., ☀️❄️]. This stunning characteristic sets the stage for your unique beauty journey!
You've bravely identified your skin as typically **${skinType}**, and your primary focus area is **${skinProblem}**. Knowing you're in the **${ageGroup}** age group and considering your lifestyle (e.g., **${lifestyleFactor}**), we're here to help you conquer these concerns with tailored advice!

---

#### 🌿 Your Personalized Skincare Revelation:

* **Identified Concern:** [State the user's skin concern vividly, e.g., "Those pesky dark spots", "The challenge of dryness"].
* **Root Cause Insights:** [Provide a brief, humanized explanation of why this concern might be present, considering skin type, age, and lifestyle if relevant. E.g., "For your dry skin, a common culprit for tightness is environmental dryness and lack of humectants." ]
* **Recommended Solution Heroes:** [Suggest 2-3 specific, innovative skincare product ingredients or types. Be descriptive and enthusiastic about their benefits, considering the user's skin type, age, and concern.]
    * [Solution 1 name/type]: [Brief benefit]
    * [Solution 2 name/type]: [Brief benefit]
* **Why These Work Wonders:** [Explain the science and benefits behind the recommended solutions in an accessible, encouraging way. Connect it directly to the user's skin type, age, and concern.]
* **Glow-Getter Product Suggestion:** [Suggest a compelling, uniquely named fictional brand and product for the primary concern. Make it sound luxurious and effective, e.g., "Introducing 'Luminosity Elixir' by Aurora Labs – your new secret weapon for a visibly brighter complexion!"]
    * **Description:** [Provide a short, enticing product description highlighting key benefits and ingredients.]

---

#### ✨ Your Daily Dose of Glow-Up Inspiration!

[Generate a joyful, motivational, and empowering closing statement (1-2 sentences) specifically for a girl/woman, encouraging them to embrace their unique beauty and feel confident, based on the skincare journey. Use inspiring language.]
`;
    } else if (mode === 'makeup-artist') {
        const eventType = req.body.eventType;
        const dressType = req.body.dressType;
        const dressColor = req.body.dressColor; 
        const userStylePreference = req.body.userStylePreference; 

        textPromptString = `
You are an incredibly talented, warm, and highly personalized makeup artist, like a favorite salon stylist or beauty guru. Your goal is to design an exquisite, step-by-step makeup look that perfectly complements the user's features, the specific occasion, their outfit, and their personal style. Your tone should be vibrant, inspiring, and make the user feel excited and beautiful for their event. Focus on a happy, joyful, motivational tone, specifically tailored for girls/women attending the event.

Here is the user's information:
- Event/Occasion: "${eventType}"
- Dress/Outfit Type: "${dressType}"
- Dress/Outfit Color: "${dressColor}"
- User Style Preference: "${userStylePreference}"

Analyze the provided image for skin tone (Warm/Cool/Neutral), facial features, and overall face shape.
Based on the image analysis, event, dress type, dress color, and user style preference, craft a complete, step-by-step personalized makeup look suggestion. This should include detailed application instructions, specific product types and shades, and a comprehensive product list with fictional brand and product names.

**Format the response strictly in Markdown, using clear, inviting headings for sections, and adhere to this exact order:**

# Your Custom Makeup Look by GlowReader! 💅

### Get Ready to Dazzle!

[Generate a vibrant, joyful, and empowering introduction (1-2 sentences) for a girl/woman, making them feel like a superstar ready for their "${eventType}" event. Explicitly connect the excitement to their "${dressType}" and "${dressColor}" outfit. Use inspiring language.]

Your unique features and beautiful skin tone (appearing to be **[Detected Skin Tone]**) are the perfect canvas for this masterpiece. Let's create magic!

---

#### 🎨 Your Step-by-Step Makeup Tutorial:

Here’s your personalized guide to achieving a flawless and captivating look, designed just for you:

1.  **Prep & Prime Perfection:** [Detailed step: Advise on hydrating and priming. Suggest a fictional product type, e.g., "Begin with a hydrating primer like 'Silk Veil Base' by AuraBeauty to create a smooth, long-lasting canvas." Add detail about *why* it's important.]
2.  **Flawless Foundation & Concealer:** [Detailed step: Advise on foundation finish (e.g., luminous, matte), type (e.g., serum, cream), and application technique (brush, sponge, fingers). Advise on concealer for specific areas (under eyes, blemishes). Suggest shades and fictional product.]
3.  **Captivating Eyes:** [Detailed steps for eyeshadow (colors, placement for eye shape and skin tone), eyeliner (style for eye shape), and mascara (technique for lash type). Be specific about colors and placement. Suggest fictional product names and shades.]
    * **Eyeshadow:** [Detailed steps]
    * **Eyeliner & Mascara:** [Detailed steps]
4.  **Sculpted Cheeks & Radiant Glow:** [Detailed steps for blush (placement, shade, type), and subtle contour/highlighting (product type, placement) for face shape and event. Suggest fictional product names and shades.]
5.  **Lips That Speak Volumes:** [Detailed step for lip liner (if needed), lipstick/lip gloss application technique, and suggested shade/finish that complements the overall look, skin tone, and outfit color. Suggest fictional product names and shades.]
6.  **Setting for Longevity:** [Detailed step for setting spray or powder to lock in the look. Suggest a fictional product.]

---

#### ✨ Pro Stylist Secrets for Your Masterpiece:

* [Provide 1-2 actionable, sophisticated, expert tips for application or product selection to elevate the look. Focus on unique tricks or personalized advice for their features/occasion/style.]
* [Offer an encouraging final thought about confidence and owning their unique beauty for the event.]

---

#### 🛍️ Your Curated Glow-Up Collection (Fictional Product Inspiration):

Here are some exquisite fictional product types and shades to inspire your perfect look. Imagine these as your go-to essentials, tailored for you!

* **Primer:** [Fictional Brand/Product Name and specific type/finish] (e.g., "Smooth Canvas Hydrating Primer by AuraBeauty - Type: Dewy Finish")
    * **Description:** [Concise, enticing product description highlighting key benefits and ingredients.]
* **Foundation:** [Fictional Brand/Product Name and specific type/finish] - Shade: "[Creative Shade Color Name]" (e.g., "Radiant Silk Luminous Foundation by LuxeGlow - Shade: 'Golden Petal'")
    * **Description:** [Concise, enticing product description]
* **Concealer:** [Fictional Brand/Product Name and specific type/finish] - Shade: "[Creative Shade Color Name]" (e.g., "Brightening Undereye Creamy Concealer by ClearSkin - Shade: 'Vanilla Dream'")
    * **Description:** [Concise, enticing product description]
* **Eyeshadow Palette:** [Fictional Brand/Product Name] - Colors: [3-5 Specific, evocative Color Names] (e.g., "Event Horizon Palette by Starlight Beauty - Colors: 'Cosmic Gold', 'Deep Nebula Plum', 'Shimmering Stardust'")
    * **Description:** [Concise, enticing product description]
* **Eyeliner:** [Fictional Brand/Product Name] - Shade: "[Creative Shade Color Name]" (e.g., "Precision Liquid Liner by Noir Cosmetics - Shade: 'Midnight Obsidian'")
    * **Description:** [Concise, enticing product description]
* **Mascara:** [Fictional Brand/Product Name] - Type: [Specific type, e.g., "Volumizing", "Lengthening"] (e.g., "Volumizing Lash Elixir by LashLux - Type: Extreme Volume")
    * **Description:** [Concise, enticing product description]
* **Blush:** [Fictional Brand/Product Name and type] - Shade: "[Creative Shade Color Name]" (e.g., "Velvet Petal Cream Blush by Bloom Beauty - Shade: 'Sun-Kissed Peach'")
    * **Description:** [Concise, enticing product description]
* **Highlighter:** [Fictional Brand/Product Name and type] - Shade: "[Creative Shade Color Name]" (e.g., "Moonbeam Liquid Luminizer by Celestial Glow - Shade: 'Golden Radiance'")
    * **Description:** [Concise, enticing product description]
* **Lipstick/Gloss:** [Fictional Brand/Product Name and type] - Shade: "[Creative Shade Color Name]" (e.g., "Satin Rouge Lipstick by RougeÉclat - Shade: 'Crimson Kiss'")
    * **Description:** [Concise, enticing product description]
* **Setting Spray:** [Fictional Brand/Product Name] - Type: [Specific type, e.g., "Matte", "Dewy", "Long-lasting"] (e.g., "Everlasting Fix Dewy Mist by Flawless Finish - Type: Radiant Dewy")
    * **Description:** [Concise, enticing product description]
`;
    } else {
        return res.status(400).json({ error: 'Invalid mode specified.' });
    }

    try {
        contentsParts = [{ text: textPromptString }, imagePart];
        
        const result = await model.generateContent({
            contents: [{ parts: contentsParts }], 
            safetySettings,
        });

        const response = await result.response;
        const markdownResponse = response.text();

        console.log('Gemini API call successful. Sending response to frontend.');
        console.log('Gemini Response (Markdown):', markdownResponse); 
        res.json({ markdown: markdownResponse });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        if (error.response && error.response.status) {
            console.error('Gemini API Error Status:', error.response.status);
            try {
                const errorData = await error.response.json(); 
                console.error('Gemini API Error Data (JSON):', errorData);
            } catch {
                console.error('Gemini API Error Data (Text):', await error.response.text()); 
            }
        }
        res.status(500).json({ 
            error: 'Failed to get analysis from AI.', 
            details: error.message 
        });
    }
});


console.log('All routes have been defined.');

const server = app.listen(PORT, () => {
  console.log('--- SUCCESS! ---');
  console.log(`Server is running and listening on http://localhost:${PORT}`);
  console.log(`Frontend accessible at http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('--- SERVER FAILED TO START ---');
  console.error('Error details:', error);
  if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please close the other application using this port or choose a different one.`);
  }
});

console.log('--- Initial code has finished. The server is now waiting for requests... ---\n');
