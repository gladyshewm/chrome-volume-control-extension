# Volume Control Chrome Extension

## Overview
Volume Control is a Chrome extension that allows users to manage audio volume on individual tabs. Users can adjust the volume of specific tabs, mute/unmute them, and quickly navigate to tabs where sound is playing.

## Features
- Adjust the volume of individual tabs.
- Mute and unmute specific tabs.
- View a list of tabs playing audio.
- Quickly switch to an active tab with sound.
- Persistent theme preference (dark/light mode).
- Hotkey support (`Alt+Q`) to open the popup.

## Installation

1. Download or clone the repository.
   ```sh
   git clone https://github.com/gladyshewm/chrome-volume-control-extension.git
   cd chrome-volume-control-extension
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked** and select the project folder.
5. The extension is now installed and ready to use!

## Usage
1. Click the extension icon in the toolbar or press `Alt+Q` to open the popup.
2. Adjust the volume for individual tabs using the provided sliders.
3. Click on a tab in the list to navigate to it.
4. Use the mute button to quickly mute/unmute a tab.

## Permissions
The extension requires the following permissions:
- `tabs`: To access and manage browser tabs.
- `activeTab`: To interact with the currently active tab.
- `offscreen`: Required for processing audio in the background.
- `tabCapture`: To manipulate audio streams from tabs.
- `storage`: To save user preferences (e.g., theme settings).
- `commands`: To allow hotkey functionality.
- `scripting`: To modify tab content and control the audio.
