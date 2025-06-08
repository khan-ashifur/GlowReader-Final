// --- FULL script.js CODE ---

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const form = document.getElementById('analysis-form');
    // ... other element references
    
    // --- NEW FUNCTION TO CREATE PRODUCT LINKS ---
    const createProductLinks = (htmlContent) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        const productTags = tempDiv.querySelectorAll('product');
        productTags.forEach(tag => {
            const productText = tag.textContent;
            // IMPORTANT: Replace 'YOUR_AMAZON_TAG-20' with your own Amazon Associates ID
            const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(productText)}&tag=YOUR_AMAZON_TAG-20`;
            
            const link = document.createElement('a');
            link.href = amazonUrl;
            link.textContent = `Shop for "${productText}"`;
            link.className = 'product-link';
            link.target = '_blank'; // Opens the link in a new tab
            
            tag.parentNode.replaceChild(link, tag);
        });

        return tempDiv.innerHTML;
    };


    const handleApiResponse = (markdown) => {
        // ... (The beginning of this function remains the same) ...

        const htmlContent = marked.parse(markdownForDisplay);

        // NEW STEP: Process the HTML to add product links
        const finalHtml = createProductLinks(htmlContent);

        // Append the final results
        const textResultDiv = document.createElement('div');
        textResultDiv.innerHTML = finalHtml;
        resultContainer.appendChild(textResultDiv);
        
        resultContainer.style.display = 'block';
    };

    // ... (The rest of your script.js code remains largely the same) ...
});