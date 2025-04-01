import {
  getActiveTabId,
  captureTabAudio,
  sendMessageToOffscreen,
} from './utils.js';

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-volume') {
    chrome.action.openPopup();
  }
});

let tabAudioStreams = {};

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'start-audio') {
    handleStartAudio(message, sender)
      .then((res) => sendResponse(res))
      .catch((err) => {
        console.error('Error handling start-audio:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (
    message.type === 'update-gain' &&
    typeof message.data === 'number' &&
    !isNaN(message.data)
  ) {
    handleUpdateGain(message)
      .then((res) => sendResponse(res))
      .catch((err) => {
        console.error('Error handling update-gain:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabAudioStreams[tabId]) {
    sendMessageToOffscreen({ type: 'stop-audio', tabId }).catch((err) =>
      console.error('Error stopping audio:', err),
    );
    delete tabAudioStreams[tabId];
  }
  chrome.storage.session.remove(`volume_${tabId}`);
});

async function handleStartAudio(message, sender) {
  let tabId = message.tabId;

  if (!tabId) tabId = sender.tab?.id || (await getActiveTabId());
  if (!tabId) throw new Error("Couldn't determine tab ID");

  if (tabAudioStreams[tabId]) {
    console.log(`Audio stream for tab ${tabId} already exists`);
    return { success: true, tabId };
  }

  const streamId = await captureTabAudio(tabId);
  tabAudioStreams[tabId] = streamId;

  await sendMessageToOffscreen({
    type: 'start-audio',
    tabId,
    data: streamId,
  });

  return { success: true, tabId };
}

async function handleUpdateGain(message) {
  await sendMessageToOffscreen({
    type: 'update-gain',
    tabId: message.tabId,
    value: message.data,
  });

  return { success: true };
}
