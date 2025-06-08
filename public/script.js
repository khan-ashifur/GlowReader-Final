// --- FULL script.js CODE ---

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const resultContainer = document.getElementById('result-container');
    // ... other element references ...
    
    // --- NEW PROGRESS BAR FUNCTION ---
    const renderSkinAnalysisBars = (concerns) => {
        let barsHtml = `<div class="analysis-bars-container"><h3>Your Skin Concerns at a Glance</h3>`;
        
        concerns.forEach(concern => {
            barsHtml += `
                <div class="progress-item">
                    <div class="progress-label">
                        <span>${concern.name}</span>
                        <span>${concern.percentage}%</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${concern.percentage}%;"></div>
                    </div>
                </div>
            `;
        });

        barsHtml += `</div>`;
        return barsHtml;
    };

    // --- NEW FUNCTION TO CREATE PRODUCT LINKS ---
    const createProductLinks = (containerElement) => {
        const paragraphs = containerElement.querySelectorAll('p');
        paragraphs.forEach(p => {
            const match = p.innerHTML.match(/<product>(.*?)<\/product>/);
            if (match && match[1]) {
                const productText = match[1];
                const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(productText)}&tag=YOUR_AMAZON_TAG-20`;
                
                const link = document.createElement('a');
                link.href = amazonUrl;
                link.textContent = `Shop for "${productText}"`;
                link.className = 'product-link';
                link.target = '_blank';
                
                p.innerHTML = '';
                p.appendChild(link);
            }
        });
    };

    // --- UPDATED RESPONSE HANDLING ---
    const handleApiResponse = (markdown) => {
        resultContainer.innerHTML = ''; // Clear previous results
        
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = markdown.match(jsonRegex);
        let markdownForDisplay = markdown;
        let analysisBarsHtml = '';

        if (match && match[1]) {
            try {
                const jsonData = JSON.parse(match[1]);
                if (jsonData.concerns) {
                    analysisBarsHtml = renderSkinAnalysisBars(jsonData.concerns);
                }
                markdownForDisplay = markdown.replace(jsonRegex, '').trim();
            } catch (e) { console.error("Failed to parse JSON:", e); }
        }
        
        const textResultDiv = document.createElement('div');
        textResultDiv.innerHTML = marked.parse(markdownForDisplay);
        createProductLinks(textResultDiv);
        
        // Add the bars first, then the text content
        resultContainer.innerHTML = analysisBarsHtml;
        resultContainer.appendChild(textResultDiv);
        
        resultContainer.style.display = 'block';
    };

    // ... (The rest of your script.js file, including history and form submission logic, remains the same) ...
});