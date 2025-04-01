let audioContexts = {};

chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message.type === 'start-audio') {
    handleStartAudio(message)
      .then((res) => sendResponse(res))
      .catch((err) => {
        // console.error('Error handling start-audio:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.type === 'update-gain') {
    handleUpdateGain(message)
      .then((res) => sendResponse(res))
      .catch((err) => {
        console.error('Error handling update-gain:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.type === 'stop-audio') {
    handleStopAudio(message)
      .then((res) => sendResponse(res))
      .catch((err) => {
        console.error('Error handling stop-audio:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

async function handleStartAudio(message) {
  const { tabId, data: streamId } = message;

  if (!tabId || !streamId)
    throw new Error(`Invalid parameters: tabId=${tabId}, streamId=${streamId}`);

  if (audioContexts[tabId]) return { success: true, reused: true };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });

    if (stream.getAudioTracks().length === 0)
      throw new Error('No audio tracks found in captured stream');

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 1; // start volume x1

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    audioContexts[tabId] = {
      audioCtx,
      gainNode,
      source,
      stream,
      createdAt: new Date(),
    };

    return { success: true };
  } catch (error) {
    console.error(`Failed to capture audio for tab ${tabId}:`, error);
    throw new Error(`Failed to capture audio for tab ${tabId}`);
  }
}

async function handleUpdateGain(message) {
  const tabId = message.tabId;
  const value = message.value;

  if (!tabId || typeof value !== 'number' || isNaN(value)) {
    return { success: false, error: 'Invalid gain value' };
  }

  if (!audioContexts[tabId]) {
    console.error(`No audio context found for tab ${tabId}`);
    return { success: false, error: 'No audio context found' };
  }

  try {
    audioContexts[tabId].gainNode.gain.value = value;
    return { success: true };
  } catch (error) {
    console.error(`Failed to update gain for tab ${tabId}:`, error);
    throw new Error(`Failed to update gain for tab ${tabId}`);
  }
}

async function handleStopAudio(message) {
  const { tabId } = message;
  if (!tabId) throw new Error('No tabId provided');

  if (!audioContexts[tabId]) {
    console.log(`No audio context found for tab ${tabId}`);
    return { success: true };
  }

  try {
    if (audioContexts[tabId].stream) {
      audioContexts[tabId].stream.getTracks().forEach((track) => track.stop());
    }

    audioContexts[tabId].source.disconnect();
    audioContexts[tabId].gainNode.disconnect();

    await audioContexts[tabId].audioCtx.close();
    delete audioContexts[tabId];

    return { success: true };
  } catch (error) {
    console.error(`Error stopping audio for tab ${tabId}:`, error);
    throw new Error(`Failed to stop audio for tab ${tabId}`);
  }
}
