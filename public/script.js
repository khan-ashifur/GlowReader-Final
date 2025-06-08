document.addEventListener('DOMContentLoaded', () => {
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
  let skinChartInstance = null;

  // Toggle input fields based on mode
  modeSelect.addEventListener('change', () => {
    skinFields.style.display = modeSelect.value === 'skin-analyzer' ? 'block' : 'none';
    makeupFields.style.display = modeSelect.value === 'makeup-artist' ? 'block' : 'none';
  });

  // Typing effect for Markdown response
  const handleApiResponse = (markdown) => {
    resultContainer.innerHTML = '';

    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = markdown.match(jsonRegex);
    let markdownForDisplay = markdown;

    if (match && match[1]) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData.concerns) {
          resultContainer.innerHTML = `
            <div id="chart-container" style="display:none;">
              <h3>Your Skin Concerns at a Glance</h3>
              <canvas id="skin-chart"></canvas>
            </div>`;
          const chartCanvas = document.getElementById('skin-chart');
          document.getElementById('chart-container').style.display = 'block';

          if (skinChartInstance) skinChartInstance.destroy();

          skinChartInstance = new Chart(chartCanvas, {
            type: 'bar',
            data: {
              labels: jsonData.concerns.map(c => c.name),
              datasets: [{
                label: 'Concern Level',
                data: jsonData.concerns.map(c => c.percentage),
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

          markdownForDisplay = markdown.replace(jsonRegex, '').trim();
        }
      } catch (e) {
        console.error("JSON parse error:", e);
      }
    }

    const displayDiv = document.createElement('div');
    resultContainer.appendChild(displayDiv);
    resultContainer.style.display = 'block';

    const parsedHTML = marked.parse(markdownForDisplay);

    const showTypingEffect = (element, htmlContent, speed = 10) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const nodes = Array.from(tempDiv.childNodes);
      let i = 0;

      const typeNext = () => {
        if (i >= nodes.length) return;
        element.appendChild(nodes[i].cloneNode(true));
        i++;
        setTimeout(typeNext, speed * 20);
      };

      typeNext();
    };

    showTypingEffect(displayDiv, parsedHTML);
  };

  // History utilities
  const getHistory = () => JSON.parse(localStorage.getItem('glowReaderHistory')) || [];

  const saveToHistory = (type, content) => {
    const history = getHistory();
    const newEntry = { id: Date.now(), type, date: new Date().toLocaleString(), content };
    history.unshift(newEntry);
    localStorage.setItem('glowReaderHistory', JSON.stringify(history));
    renderHistory();
  };

  const renderHistory = () => {
    const history = getHistory();
    historyList.innerHTML = '';
    historyPanel.style.display = history.length ? 'block' : 'none';

    history.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.type}</strong><br>${item.date}`;
      li.onclick = () => handleApiResponse(item.content);
      historyList.appendChild(li);
    });
  };

  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('glowReaderHistory');
    renderHistory();
  });

  // Submit handler
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!photoUpload.files[0]) {
      resultContainer.innerHTML = `<p style="color:red;">Please upload a photo.</p>`;
      return;
    }

    // Reset
    form.style.display = 'none';
    resultContainer.style.display = 'none';
    loader.style.display = 'flex';

    // Restart typing animation
    const typingText = loader.querySelector('.typing-text');
    if (typingText) {
      typingText.style.animation = 'none';
      void typingText.offsetWidth;
      typingText.style.animation = null;
    }

    const formData = new FormData(form);

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error("Something went wrong");

      const result = await response.json();
      handleApiResponse(result.markdown);

      const analysisType = modeSelect.value === 'skin-analyzer'
        ? 'Skin Analysis'
        : `Makeup Look for ${formData.get('eventType') || 'Event'}`;
      saveToHistory(analysisType, result.markdown);
    } catch (error) {
      resultContainer.innerHTML = `
        <p style="color:red;">Oops! Something went wrong.</p>
        <p>${error.message}</p>`;
      resultContainer.style.display = 'block';
    } finally {
      loader.style.display = 'none';
      form.style.display = 'block';
    }
  });

  // On load
  renderHistory();
});
