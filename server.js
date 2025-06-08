// --- FINAL server.js with Correct Static Paths ---

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold
} = require('@google/generative-ai');

const app = express();
const upload = multer();

const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files like style.css from root
app.use(express.static(__dirname));

// ✅ Load homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Gemini API Setup ---
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('❌ GOOGLE_API_KEY not found in .env!');
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
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };
}

// --- Vision API Route ---
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
You are "Aura," a world-class AI beauty expert. Fun, witty, and supportive — your job is to make the user feel amazing 💖.

User data:
- Skin Type: "${skinType}"
- Concern: "${skinProblem}"
- Age Group: "${ageGroup}"
- Lifestyle: "${lifestyleFactor}"

Analyze the uploaded image to determine skin tone. Then generate a JSON concern chart, followed by a vibrant Markdown skin analysis.

### Example:
\`\`\`json
{
  "concerns": [
    {"name": "Hydration", "percentage": 45},
    {"name": "Oiliness", "percentage": 70}
  ]
}
\`\`\`

# Your Radiant GlowReader Skin Analysis ✨
(Then continue with fun, human-style breakdown)
    `;
  } else if (mode === 'makeup-artist') {
    const { eventType, dressType, dressColor, userStylePreference } = req.body;
    textPromptString = `
You are "Aura," the ultimate Gen Z AI makeup guru 💄. Help the user look amazing for their event.

User Info:
- Event: "${eventType}"
- Dress: "${dressType}" in "${dressColor}"
- Style: "${userStylePreference}"

Analyze the face from the image and recommend a stunning, personalized makeup routine in Markdown.
    `;
  } else {
    return res.status(400).json({ error: 'Invalid mode specified.' });
  }

  try {
    const result = await model.generateContent({
      contents: [{
        parts: [{ text: textPromptString }, imagePart]
      }],
      safetySettings
    });

    const response = await result.response;
    const markdown = response.text();
    res.json({ markdown });

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    res.status(500).json({
      error: 'AI analysis failed.',
      details: error.message
    });
  }
});

// --- Start Server ---
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
});
