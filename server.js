// --- FINAL server.js CODE with Typo Corrected ---

require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const path = require('path'); // THIS LINE IS NOW CORRECTED
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
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      },
    };
}

// --- ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// The rest of your code (the /api/vision route) remains the same
app.post('/api/vision', upload.single('photo'), async (req, res) => {
    // All of the AI logic you have inside this function is correct and does not need to change.
});

// --- SERVER START ---
const server = app.listen(PORT, () => {
  console.log(`--- SUCCESS! Server is running on port ${PORT} ---`);
});

server.on('error', (error) => {
  console.error('--- SERVER FAILED TO START ---', error);
});