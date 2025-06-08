// --- FULL script.js CODE ---

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const modeSelect = document.getElementById('mode-select');
    const skinFields = document.getElementById('skin-analyzer-fields');
    const makeupFields = document.getElementById('makeup-artist-fields');
    const form = document.getElementById('analysis-form');
    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('result-container');
    const photoUpload = document.getElementById('photo-upload');
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    let skinChartInstance = null; // To hold the chart instance

    // --- ONBOARDING LOGIC ---
    const handleOnboarding = () => {
        const hasVisited = localStorage.getItem('glowReaderVisited');
        if (!hasVisited) {
            const welcomeModal = document.getElementById('welcome-modal');
            welcomeModal.classList.add('visible');
            
            const closeModalBtn = document.getElementById('close-modal-btn');
            closeModalBtn.addEventListener('click', () => {
                welcomeModal.classList.remove('visible');
                localStorage.setItem('glowReaderVisited', 'true');
            });
        }
    };
    
    // --- CHART FUNCTION ---
    const renderSkinAnalysisChart = (concerns) => {
        const chartContainer = document.getElementById('chart-container');
        const chartCanvas = document.getElementById('skin-chart');
        chartContainer.style.display = 'block';

        if (skinChartInstance) {
            skinChartInstance.destroy();
        }

        const labels = concerns.map(c => c.name);
        const data = concerns.map(c => c.percentage);

        skinChartInstance = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Concern Level',
                    data: data,
                    backgroundColor: 'rgba(131, 111, 255, 0.6)',
                    borderColor: 'rgba(131, 111, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true, max: 100 }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    };

    // --- NEW FUNCTION TO CREATE PRODUCT LINKS ---
    const createProductLinks = (containerElement) => {
        // Find any <p> tags that contain our placeholder <product> tags
        const paragraphs = containerElement.querySelectorAll('p');
        paragraphs.forEach(p => {
            if (p.innerHTML.includes('<product>')) {
                const productText = p.textContent.trim();
                // IMPORTANT: Replace 'YOUR_AMAZON_TAG-20' with your own Amazon Associates ID
                const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(productText)}&tag=YOUR_AMAZON_TAG-20`;
                
                const link = document.createElement('a');
                link.href = amazonUrl;
                link.textContent = `Shop for "${productText}"`;
                link.className = 'product-link';
                link.target = '_blank'; // Opens the link in a new tab
                
                // Replace the paragraph's content with the new link button
                p.innerHTML = '';
                p.appendChild(link);
            }
        });
    };

    // --- HISTORY MANAGEMENT FUNCTIONS ---
    const getHistory = () => JSON.parse(localStorage.getItem('glowReaderHistory')) || [];

    const saveToHistory = (type, content) => {
        const history = getHistory();
        const newEntry = { id: Date.now(), type, date: new Date().toLocaleString(), content };
        history.unshift(newEntry);
        localStorage.setItem('glowReaderHistory', JSON.stringify(history));
        renderHistory(newEntry.id);
    };

    const renderHistory = (newestId = null) => {
        const history = getHistory();
        historyList.innerHTML = '';
        historyPanel.style.display = history.length > 0 ? 'block' : 'none';

        history.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            li.innerHTML = `<span class="history-item-title">${item.type}</span><div class="history-item-date">${item.date}</div>`;
            if (item.id === newestId) {
                li.classList.add('new-item');
                setTimeout(() => li.classList.remove('new-item'), 3000);
            }
            historyList.appendChild(li);
        });
    };
    
    const displayFromHistory = (id) => {
        const item = getHistory().find(entry => entry.id == id);
        if (item) {
            handleApiResponse(item.content);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const clearHistory = () => {
        localStorage.removeItem('glowReaderHistory');
        renderHistory();
        resultContainer.style.display = 'none';
        if (skinChartInstance) skinChartInstance.destroy();
    };

    // --- RESPONSE HANDLING ---
    const handleApiResponse = (markdown) => {
        resultContainer.innerHTML = ''; // Clear previous results completely
        
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = markdown.match(jsonRegex);
        let markdownForDisplay = markdown;

        if (match && match[1]) {
            try {
                const jsonData = JSON.parse(match[1]);
                const chartContainerHtml = `<div id="chart-container" style="display: none;"><h3>Your Skin Concerns at a Glance</h3><canvas id="skin-chart"></canvas></div>`;
                resultContainer.innerHTML = chartContainerHtml;
                if (jsonData.concerns) {
                    renderSkinAnalysisChart(jsonData.concerns);
                }
                markdownForDisplay = markdown.replace(jsonRegex, '').trim();
            } catch (e) { console.error("Failed to parse JSON:", e); }
        }
        
        const textResultDiv = document.createElement('div');
        textResultDiv.innerHTML = marked.parse(markdownForDisplay);
        
        // NEW: Call the function to transform product tags into links
        createProductLinks(textResultDiv);
        
        resultContainer.appendChild(textResultDiv);
        resultContainer.style.display = 'block';
    };

    // --- EVENT LISTENERS ---
    modeSelect.addEventListener('change', () => {
        skinFields.style.display = modeSelect.value === 'skin-analyzer' ? 'block' : 'none';
        makeupFields.style.display = modeSelect.value === 'makeup-artist' ? 'block' : 'none';
    });
    
    historyList.addEventListener('click', (e) => (e.target.closest('li')) && displayFromHistory(e.target.closest('li').dataset.id));
    clearHistoryBtn.addEventListener('click', clearHistory);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!photoUpload.files[0]) {
            resultContainer.innerHTML = `<p style="color: red;">Please upload a photo.</p>`;
            resultContainer.style.display = 'block';
            return;
        }
        
        form.style.display = 'none';
        resultContainer.style.display = 'none';
        loader.style.display = 'block';

        const formData = new FormData(form);
        try {
            const response = await fetch('/api/vision', { method: 'POST', body: formData });
            if (!response.ok) {
                let errorMsg = 'An unknown server error occurred.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    // Response was not JSON, do nothing
                }
                throw new Error(errorMsg);
            }
            
            const result = await response.json();
            handleApiResponse(result.markdown);
            
            let analysisType = modeSelect.value === 'skin-analyzer' 
                ? 'Skin Analysis' 
                : `Makeup Look for ${formData.get('eventType') || 'Event'}`;
            saveToHistory(analysisType, result.markdown);
        } catch (error) {
            resultContainer.innerHTML = `<p style="color: red; font-weight: bold;">Oops! Something went wrong.</p><p>Error: ${error.message}</p>`;
            resultContainer.style.display = 'block';
        } finally {
            loader.style.display = 'none';
            form.style.display = 'block';
        }
    });
    
    // --- INITIALIZATION ---
    renderHistory();
    handleOnboarding();
});