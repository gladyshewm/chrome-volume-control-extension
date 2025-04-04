const themeToggle = document.getElementById('theme-toggle');
const header = document.querySelector('header');
const headerTitle = header.querySelector('header .title');
const muteButton = document.querySelector('.volume-actions__mute');
const resetButton = document.querySelector('.volume-actions__reset');
const slider = document.querySelector('.volume-slider__slider');
const currentVolume = document.querySelector('.volume-info__current b');
const tabsContainer = document.querySelector('.tabs');
const tabsTitle = document.querySelector('.tabs__title');
const muteSVG = `
        <svg
          version="1.1"
          viewBox="0 0 24 24"
          enable-background="new 0 0 24 24"
          xml:space="preserve"
        >
          <g id="volume-mute">
            <g>
              <path
                d="M13,23.1L5.6,17H0V7h5.6L13,0.9V23.1z M2,15h4.4l4.6,3.9V5.1L6.4,9H2V15z"
              />
            </g>
            <g>
              <polygon
                points="22.3,16.2 19.5,13.4 16.7,16.2 15.3,14.8 18.1,12 15.3,9.2 16.7,7.8 19.5,10.6 22.3,7.8 23.7,9.2 20.9,12 
           23.7,14.8 		"
              />
            </g>
          </g></svg>
`;
const unmuteSVG = `
        <svg
          version="1.1"
          id="XMLID_234_"
          viewBox="0 0 24 24"
          enable-background="new 0 0 24 24"
          xml:space="preserve"
        >
          <g id="volume">
            <g>
              <path
                d="M13,23.1L5.6,17H0V7h5.6L13,0.9C13,0.9,13,23.1,13,23.1z M2,15h4.4l4.6,3.9V5.1L6.4,9H2V15z M15,21v-2c3.9,0,7-3.1,7-7
         s-3.1-7-7-7V3c5,0,9,4,9,9S20,21,15,21z M15,17v-2c1.7,0,3-1.3,3-3s-1.3-3-3-3V7c2.8,0,5,2.2,5,5S17.8,17,15,17z"
              />
            </g>
          </g></svg
        >
`;
let currentTabId = null;

chrome.storage.local.get('theme', (data) => {
  let theme = data.theme;

  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  themeToggle.checked = theme === 'dark';
  document.body.classList.add(theme);
});

themeToggle.addEventListener('change', () => {
  const newTheme = themeToggle.checked ? 'dark' : 'light';
  document.body.classList.replace(
    themeToggle.checked ? 'light' : 'dark',
    newTheme,
  );
  chrome.storage.local.set({ theme: newTheme });
});

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  if (tabs.length > 0) {
    currentTabId = tabs[0].id;

    const { [`muted_${currentTabId}`]: isMuted = false } =
      await chrome.storage.session.get(`muted_${currentTabId}`);
    const { [`volume_${currentTabId}`]: volume = 1 } =
      await chrome.storage.session.get(`volume_${currentTabId}`);

    slider.value = volume;
    updateSliderUI();
    updateMuteUI(isMuted);

    chrome.action.setBadgeText({
      text: isMuted ? 'MUTE' : String(Math.round(volume * 100)),
    });

    await startAudioCapture(currentTabId);
  }
});

chrome.tabs.query({ audible: true }, (tabs) => {
  if (tabs.length === 0) return;

  if (tabs.length > 0) {
    tabsTitle.innerHTML = `<b>${formatTabsTitle(tabs.length)}</b>`;
  }

  tabs.forEach((tab) => {
    const tabElement = document.createElement('div');
    tabElement.classList.add('tab-item');
    tabElement.innerHTML = `
        <abbr title="${tab.title}">
          <img src="${
            tab.favIconUrl || 'icons/icon-32.png'
          }" class="tab-icon" />
          <span class="tab-title">${tab.title}</span>
        </abbr>
      `;

    tabElement.addEventListener('click', () => {
      chrome.tabs.update(tab.id, { active: true });
    });

    tabsContainer.appendChild(tabElement);
  });
});

muteButton.addEventListener('click', async () => {
  const isMuted = muteButton.classList.toggle('muted');

  await chrome.storage.session.set({ [`muted_${currentTabId}`]: isMuted });
  await muteVolumeForTab(isMuted);

  updateMuteUI(isMuted);
});

resetButton.addEventListener('click', () => {
  slider.value = 1;
  updateVolumeForTab(1);
  updateSliderUI();
});

slider.addEventListener('input', () => {
  const volume = parseFloat(slider.value);
  updateVolumeForTab(volume);
  updateSliderUI();
});

const formatTabsTitle = (count) =>
  `${count} ${count === 1 ? 'tab' : 'tabs'} playing now`;

const updateSliderUI = () => {
  const min = slider.min;
  const max = slider.max;
  const val = slider.value;
  const percent = ((val - min) / (max - min)) * 100;

  slider.style.background = `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${percent}%, var(--btn-hover-color) ${percent}%, var(--btn-hover-color) 100%)`;
  currentVolume.innerHTML = `Volume: ${Math.round(val * 100)} %`;
};

const startAudioCapture = async (tabId) => {
  if (!tabId) return;

  try {
    await chrome.runtime.sendMessage({
      type: 'start-audio',
      tabId,
    });
  } catch (error) {
    console.error('Error starting audio capture:', error);
  }
};

const updateVolumeForTab = async (volume) => {
  if (!currentTabId) return;

  try {
    await chrome.storage.session.set({ [`volume_${currentTabId}`]: volume });

    await chrome.runtime.sendMessage({
      type: 'update-gain',
      tabId: currentTabId,
      data: volume,
    });

    chrome.action.setBadgeText({
      text: String(Math.round(volume * 100)),
    });
  } catch (error) {
    console.error('Error updating volume:', error);
  }
};

const muteVolumeForTab = async (isMuted) => {
  if (!currentTabId) return;

  try {
    await chrome.runtime.sendMessage({
      type: 'toggle-mute',
      tabId: currentTabId,
      muted: isMuted,
    });

    chrome.action.setBadgeText({
      text: isMuted ? 'MUTE' : String(Math.round(slider.value * 100)),
    });
  } catch (error) {
    console.error('Error muting volume:', error);
  }
};

const updateMuteUI = (isMuted) => {
  header.classList.toggle('muted', isMuted);

  if (isMuted) {
    muteButton.classList.add('muted');
    muteButton.innerHTML = `${muteSVG}<span>Unmute</span>`;
    slider.setAttribute('disabled', true);
    headerTitle.innerHTML = `${muteSVG}<h1>Volume Control</h1>`;
  } else {
    muteButton.classList.remove('muted');
    muteButton.innerHTML = `${unmuteSVG}<span>Mute</span>`;
    slider.removeAttribute('disabled');
    headerTitle.innerHTML = `${unmuteSVG}<h1>Volume Control</h1>`;
  }
};
