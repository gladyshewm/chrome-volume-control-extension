export const getActiveTabId = async () => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return resolve(null);
      resolve(tabs[0].id);
    });
  });
};

export const captureTabAudio = async (tabId) => {
  try {
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId,
    });

    if (!streamId) {
      throw new Error(`Failed to get streamId for tab ${tabId}`);
    }

    return streamId;
  } catch (error) {
    console.error(`Error capturing tab audio for tab ${tabId}:`, error);
    throw new Error(`Failed to capture audio for tab ${tabId}`);
  }
};

export const ensureOffscreenDocument = async () => {
  const existingContexts = await chrome.runtime.getContexts({});
  const offscreenDoc = existingContexts.find(
    (c) => c.contextType === 'OFFSCREEN_DOCUMENT',
  );

  if (!offscreenDoc) {
    await chrome.offscreen.createDocument({
      url: 'html/offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Audio stream processing',
    });

    return true;
  }

  return false;
};

export const sendMessageToOffscreen = async (message) => {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage(message);
};
