document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('analysis-form');
  const loader = document.getElementById('loader');
  const resultContainer = document.getElementById('result-container');
  const photoUpload = document.getElementById('photo-upload');
  const skinTone = document.getElementById('skin-tone');
  const lipstick = document.getElementById('lipstick');
  const proTip = document.getElementById('pro-tip');
  const resultImage = document.getElementById('result-image');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loader
    loader.classList.remove('hidden');
    resultContainer.classList.add('hidden');

    // Simulate API call
    setTimeout(() => {
      loader.classList.add('hidden');
      resultContainer.classList.remove('hidden');

      const file = photoUpload.files[0];
      const reader = new FileReader();

      reader.onload = function () {
        resultImage.src = reader.result;
      };

      if (file) {
        reader.readAsDataURL(file);
      }

      // Fake data
      skinTone.textContent = "Warm Honey";
      lipstick.textContent = "Peach Coral";
      proTip.textContent = "Try bronzy highlighter for a glowing finish!";
    }, 2500);
  });
});
