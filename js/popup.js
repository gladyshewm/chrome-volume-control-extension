const slider = document.querySelector('.volume-slider__slider');

slider.addEventListener('input', () => {
  const min = slider.min;
  const max = slider.max;
  const val = slider.value;

  const percent = ((val - min) / (max - min)) * 100;

  slider.style.background = `linear-gradient(to right, #2a9300 0%, #2a9300 ${percent}%, #333333 ${percent}%, #333333 100%)`;
});
