chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-volume') {
    chrome.action.openPopup();
  }
});
