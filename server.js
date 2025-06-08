// --- FINAL server.js for Render Deployment ---

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Optional: Manually serve index.html (or let the static middleware handle it)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_API_KEY missing in .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
      mimeType,
    },
  };
}

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
You are "Aura," a fun and talented AI beauty expert. Analyze the uploaded photo to detect skin tone (Warm/Cool/Neutral). Based on this and the following inputs:
- Skin Type: ${skinType}
- Skin Problem: ${skinProblem}
- Age Group: ${ageGroup}
- Lifestyle Factor: ${lifestyleFactor}

Return a JSON chart of skin concerns and a markdown analysis.

\`\`\`json
{
  "concerns": [
    {"name": "Hydration", "percentage": 45},
    {"name": "Oiliness", "percentage": 70}
  ]
}
\`\`\`

Follow with markdown tips like a beauty blog post.
`;
  } else if (mode === 'makeup-artist') {
    const { eventType, dressType, dressColor, userStylePreference } = req.body;
    textPromptString = `
You are "Aura," an AI makeup stylist. Analyze the user's photo for face shape and skin tone.

Event: ${eventType}
Dress Type: ${dressType}
Dress Color: ${dressColor}
Style Preference: ${userStylePreference}

Return a markdown step-by-step makeup guide tailored to them.
`;
  } else {
    return res.status(400).json({ error: 'Invalid mode.' });
  }

  try {
    const result = await model.generateContent({
      contents: [
        {
          parts: [{ text: textPromptString }, imagePart],
        },
      ],
      safetySettings,
    });

    const markdown = result.response.text();
    res.json({ markdown });
  } catch (err) {
    console.error('❌ Gemini API error:', err);
    res.status(500).json({ error: 'Failed to get response from AI.', details: err.message });
  }
});

// ✅ Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Server live at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
});
