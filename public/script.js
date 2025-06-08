// --- GlowReader script.js ---
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('analysis-form');
  const modeSelect = document.getElementById('mode-select');
  const skinFields = document.getElementById('skin-analyzer-fields');
  const makeupFields = document.getElementById('makeup-artist-fields');
  const loader = document.getElementById('loader');
  const resultContainer = document.getElementById('result-container');
  const chartContainer = document.getElementById('chart-container');
  const markdownOutput = document.getElementById('markdown-output');
  const resultImage = document.getElementById('result-image');
  const photoUpload = document.getElementById('photo-upload');
  const skinToneEl = document.getElementById('skin-tone');
  const lipstickEl = document.getElementById('lipstick');
  const proTipEl = document.getElementById('pro-tip');

  let skinChartInstance = null;

  function renderChart(concerns) {
    const labels = concerns.map(c => c.name);
    const data = concerns.map(c => c.percentage);

    if (skinChartInstance) skinChartInstance.destroy();

    skinChartInstance = new Chart(document.getElementById('skin-chart'), {
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
        scales: { x: { beginAtZero: true, max: 100 } },
        plugins: { legend: { display: false } }
      }
    });
    chartContainer.style.display = 'block';
  }

  modeSelect.addEventListener('change', () => {
    skinFields.style.display = modeSelect.value === 'skin-analyzer' ? 'block' : 'none';
    makeupFields.style.display = modeSelect.value === 'makeup-artist' ? 'block' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    loader.style.display = 'block';
    resultContainer.style.display = 'none';
    chartContainer.style.display = 'none';
    markdownOutput.innerHTML = '';

    const formData = new FormData(form);

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Server Error');

      const result = await response.json();
      const markdown = result.markdown;
      let markdownForDisplay = markdown;

      // Try to extract JSON
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = markdown.match(jsonRegex);
      if (match && match[1]) {
        try {
          const jsonData = JSON.parse(match[1]);
          if (jsonData.concerns) renderChart(jsonData.concerns);
          markdownForDisplay = markdown.replace(jsonRegex, '').trim();

          // If included in JSON, extract skin details
          if (jsonData.skinTone) skinToneEl.textContent = jsonData.skinTone;
          if (jsonData.lipstick) lipstickEl.textContent = jsonData.lipstick;
          if (jsonData.tip) proTipEl.textContent = jsonData.tip;
        } catch (err) {
          console.warn('Invalid JSON block');
        }
      }

      // Render markdown result
      markdownOutput.innerHTML = marked.parse(markdownForDisplay);
      resultContainer.style.display = 'block';

      // Image preview
      if (photoUpload.files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          resultImage.src = reader.result;
          resultImage.style.display = 'block';
        };
        reader.readAsDataURL(photoUpload.files[0]);
      }

    } catch (err) {
      markdownOutput.innerHTML = `<p style="color:red;">❌ Error: ${err.message}</p>`;
    } finally {
      loader.style.display = 'none';
    }
  });
});
