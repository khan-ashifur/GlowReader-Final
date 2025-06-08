// script.js - FINAL Version: Robust Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
    // Mode Selection Buttons
    const skinAnalyzerBtn = document.getElementById('skin-analyzer-btn');
    const makeupArtistBtn = document.getElementById('makeup-artist-btn');

    // Sections
    const skinAnalyzerSection = document.getElementById('skin-analyzer-section');
    const makeupArtistSection = document.getElementById('makeup-artist-section');
    const resultsSection = document.getElementById('results-section');

    // Skin Analyzer Form Elements
    const userForm = document.getElementById('user-form');
    const photoUploadSkin = document.getElementById('photo-upload-skin'); 
    const skinTypeSelect = document.getElementById('skin-type'); 
    const skinProblemInput = document.getElementById('skin-problem'); 
    const ageGroupSelect = document.getElementById('age-group'); 
    const lifestyleFactorInput = document.getElementById('lifestyle-factor'); 

    // Makeup Artist Form Elements
    const makeupForm = document.getElementById('makeup-form');
    const photoUploadMakeup = document.getElementById('photo-upload-makeup'); 
    const makeupEventInput = document.getElementById('makeup-event'); 
    const makeupDressInput = document.getElementById('makeup-dress'); 
    const makeupDressColorInput = document.getElementById('makeup-dress-color'); 
    const userStylePreferenceInput = document.getElementById('user-style-preference'); 
    
    // Common Results Elements
    const resultsCard = document.getElementById('results-card');
    const chartCanvas = document.getElementById('skin-concern-chart');
    const chartContainer = document.querySelector('.chart-container');
    const ctx = chartCanvas.getContext('2d');

    // --- Mode Switching Logic ---
    function showSection(sectionId) {
        // Hide all main content sections and results
        skinAnalyzerSection.classList.add('hidden');
        makeupArtistSection.classList.add('hidden');
        resultsSection.classList.add('hidden'); 

        // Show the requested section
        document.getElementById(sectionId).classList.remove('hidden');

        // Update active button state
        skinAnalyzerBtn.classList.remove('active');
        makeupArtistBtn.classList.remove('active');
        if (sectionId === 'skin-analyzer-section') {
            skinAnalyzerBtn.classList.add('active');
            chartContainer.style.display = 'none'; // Hide chart on mode switch
        } else {
            makeupArtistBtn.classList.add('active');
            chartContainer.style.display = 'none'; // Hide chart on mode switch
        }
    }

    // Event listeners for mode buttons
    skinAnalyzerBtn.addEventListener('click', () => showSection('skin-analyzer-section'));
    makeupArtistBtn.addEventListener('click', () => showSection('makeup-artist-section'));

    // --- Radar Chart Drawing Function ---
    function drawRadarChart(data) {
        if (!data || data.length === 0) {
            chartContainer.innerHTML = "<p>No chart data available.</p>";
            return;
        }

        const parentWidth = chartContainer.offsetWidth;
        const size = Math.min(parentWidth, 300); 
        
        chartCanvas.width = size;
        chartCanvas.height = size;

        const labels = data.map(d => d.name);
        const values = data.map(d => d.percentage);
        const numPoints = labels.length;
        const radius = size / 2 * 0.7; 
        const centerX = size / 2;
        const centerY = size / 2;

        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            ctx.stroke();
        }

        for (let i = 0; i <= 4; i++) { 
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * (i / 4), 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = 'rgba(215, 90, 108, 0.4)'; 
        ctx.strokeStyle = '#D75A6C'; 
        ctx.lineWidth = 2;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI - Math.PI / 2;
            const pointRadius = (values[i] / 100) * radius; 
            const x = centerX + pointRadius * Math.cos(angle);
            const y = centerY + pointRadius * Math.sin(angle);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#D75A6C';
            ctx.fill();
            ctx.fillStyle = '#4A4A4A';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[i] + ' ' + values[i] + '%', centerX + (radius + 20) * Math.cos(angle), centerY + (radius + 20) * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Add resize event listener to redraw chart
    window.addEventListener('resize', () => {
        if (chartContainer.style.display !== 'none' && resultsSection.classList.contains('chart-visible')) { 
            const storedData = resultsCard.dataset.skinConcernsData; 
            if (storedData) {
                try {
                    drawRadarChart(JSON.parse(storedData).concerns);
                } catch (jsonError) { 
                    console.error("Error re-drawing chart on resize:", jsonError);
                }
            }
        }
    });


    // --- Skin Analyzer Form Submission ---
    userForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const photoFile = photoUploadSkin.files[0]; 
        const skinType = skinTypeSelect.value; 
        const skinProblem = skinProblemInput.value.trim(); 
        const ageGroup = ageGroupSelect.value; 
        const lifestyleFactor = lifestyleFactorInput.value.trim(); 

        if (!photoFile) {
            alert('Please upload a photo for Skin Analyzer!');
            return;
        }
        if (!skinProblem || !lifestyleFactor) { 
            alert('Please fill in Skin Concern and Lifestyle Factor.');
            return;
        }


        // Show results section and loading message BEFORE fetch
        skinAnalyzerSection.classList.add('hidden'); 
        resultsSection.classList.remove('hidden'); 
        resultsCard.innerHTML = `<p>Analyzing your skin profile... Please wait.</p>`; 
        chartContainer.style.display = 'none'; 
        resultsSection.classList.remove('chart-visible'); 


        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('skinType', skinType);
        formData.append('skinProblem', skinProblem);
        formData.append('ageGroup', ageGroup); 
        formData.append('lifestyleFactor', lifestyleFactor); 
        formData.append('mode', 'skin-analyzer'); 

        try {
            const response = await fetch('http://localhost:3000/api/vision', {
                method: 'POST',
                body: formData, 
            });

            if (!response.ok) {
                const errorText = await response.text(); 
                throw new Error(`Server responded with an error: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const markdownResponse = data.markdown;

            const jsonRegex = /```json\n([\s\S]*?)\n```/;
            const match = markdownResponse.match(jsonRegex);
            let skinConcernsData = null;
            let finalMarkdown = markdownResponse;

            if (match && match[1]) {
                try {
                    skinConcernsData = JSON.parse(match[1]);
                    resultsCard.dataset.skinConcernsData = JSON.stringify(skinConcernsData); 
                    finalMarkdown = markdownResponse.replace(match[0], '').trim(); 
                } catch (jsonError) {
                    console.error("Error parsing JSON from AI response:", jsonError);
                }
            }

            const rawHtml = marked.parse(finalMarkdown);
            const cleanHtml = DOMPurify.sanitize(rawHtml);

            resultsCard.innerHTML = cleanHtml;

            if (skinConcernsData && skinConcernsData.concerns) {
                chartContainer.style.display = 'block'; 
                resultsSection.classList.add('chart-visible'); 
                drawRadarChart(skinConcernsData.concerns);
            } else {
                chartContainer.style.display = 'none'; 
                resultsSection.classList.remove('chart-visible');
            }

        } catch (error) {
            console.error('Error fetching data from backend:', error);
            resultsCard.innerHTML = `
                <h3 style="color: red;">❌ Analysis Failed</h3>
                <p>An error occurred while connecting to or receiving from the backend server.</p>
                <p><small>Error: ${error.message}</small></p>
            `;
            chartContainer.style.display = 'none'; 
            resultsSection.classList.remove('chart-visible');
        }
    });

    // --- Makeup Artist Form Submission ---
    makeupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const photoFile = photoUploadMakeup.files[0]; 
        const eventType = makeupEventInput.value.trim(); 
        const dressType = makeupDressInput.value.trim(); 
        const dressColor = makeupDressColorInput.value.trim(); 
        const userStylePreference = userStylePreferenceInput.value.trim(); 

        if (!photoFile) {
            alert('Please upload a photo for Makeup Artist!');
            return;
        }
        if (!eventType || !dressType || !dressColor || !userStylePreference) { 
            alert('Please fill in all event, dress type, dress color, and style preference fields for Makeup Artist!');
            return;
        }

        // Show results section and loading message BEFORE fetch
        makeupArtistSection.classList.add('hidden'); 
        resultsSection.classList.remove('hidden'); 
        resultsCard.innerHTML = `<p>Your personal stylist is crafting your look... Please wait.</p>`;
        chartContainer.style.display = 'none'; 
        resultsSection.classList.remove('chart-visible');


        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('eventType', eventType); 
        formData.append('dressType', dressType); 
        formData.append('dressColor', dressColor); 
        formData.append('userStylePreference', userStylePreference); 
        formData.append('mode', 'makeup-artist'); 

        try {
            const response = await fetch('http://localhost:3000/api/vision', { 
                method: 'POST',
                body: formData, 
            });

            if (!response.ok) {
                const errorText = await response.text(); 
                throw new Error(`Server responded with an error: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const markdownResponse = data.markdown;

            const rawHtml = marked.parse(markdownResponse);
            const cleanHtml = DOMPurify.sanitize(rawHtml);

            resultsCard.innerHTML = cleanHtml;

        } catch (error) {
            console.error('Error fetching makeup advice from backend:', error);
            resultsCard.innerHTML = `
                <h3 style="color: red;">❌ Makeup Advice Failed</h3>
                <p>An error occurred while getting your custom makeup advice.</p>
                <p><small>Error: ${error.message}</small></p>
            `;
            chartContainer.style.display = 'none'; 
            resultsSection.classList.remove('chart-visible');
        }
    });

    // Initialize to show skin analyzer section by default
    showSection('skin-analyzer-section');
});
