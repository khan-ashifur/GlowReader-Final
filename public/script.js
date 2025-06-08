document.addEventListener('DOMContentLoaded', () => {
  const modeSelect = document.getElementById('mode-select');
  const skinFields = document.getElementById('skin-analyzer-fields');
  const makeupFields = document.getElementById('makeup-artist-fields');
  const form = document.getElementById('analysis-form');
  const loader = document.getElementById('loader');
  const resultContainer = document.getElementById('result-container');
  const photoUpload = document.getElementById('photo-upload');

  // Switch fields based on mode
  modeSelect.addEventListener('change', () => {
    skinFields.style.display = modeSelect.value === 'skin-analyzer' ? 'block' : 'none';
    makeupFields.style.display = modeSelect.value === 'makeup-artist' ? 'block' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultContainer.innerHTML = '';
    loader.style.display = 'block';

    const formData = new FormData(form);

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Something went wrong');
      }

      const result = await response.json();

      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = result.markdown.match(jsonRegex);
      let markdownForDisplay = result.markdown;

      // Optional: parse JSON block if exists
      if (match && match[1]) {
        try {
          const jsonData = JSON.parse(match[1]);
          if (jsonData.concerns) {
            console.log('Detected concerns:', jsonData.concerns);
          }
          markdownForDisplay = result.markdown.replace(jsonRegex, '').trim();
        } catch (e) {
          console.warn('Could not parse JSON block.');
        }
      }

      // Render Markdown
      const markdownDiv = document.createElement('div');
      markdownDiv.innerHTML = marked.parse(markdownForDisplay);
      resultContainer.appendChild(markdownDiv);
      resultContainer.style.display = 'block';

    } catch (err) {
      resultContainer.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
      resultContainer.style.display = 'block';
    } finally {
      loader.style.display = 'none';
    }
  });
});
