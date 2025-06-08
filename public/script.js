// --- GlowReader script.js (Enhanced) ---
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
    const labels = concerns.map(c => `${c.name} (${c.percentage}%)`);
    const data = concerns.map(c => c.percentage);

    if (skinChartInstance) skinChartInstance.destroy();

    skinChartInstance = new Chart(document.getElementById('skin-chart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Skin Concern %',
          data: data,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, max: 100, grid: { display: false } },
          y: { grid: { display: false }, ticks: { font: { size: 14 } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.raw}%` } }
        }
      }
    });

    chartContainer.style.display = 'block';
  }

  // Toggle fields side by side
  modeSelect.addEventListener('change', () => {
    const selected = modeSelect.value;
    skinFields.style.display = selected === 'skin-analyzer' ? 'flex' : 'none';
    makeupFields.style.display = selected === 'makeup-artist' ? 'flex' : 'none';
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

          if (jsonData.skinTone) skinToneEl.textContent = jsonData.skinTone;
          if (jsonData.lipstick) lipstickEl.textContent = jsonData.lipstick;
          if (jsonData.tip) proTipEl.textContent = jsonData.tip;
        } catch (err) {
          console.warn('Invalid JSON block');
        }
      }

      markdownOutput.innerHTML = marked.parse(markdownForDisplay);
      resultContainer.style.display = 'block';

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
