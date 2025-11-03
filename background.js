// Background service worker for handling notifications

// Store tab IDs for each PR
const prTabs = new Map();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_STATUS_CHANGE') {
    const { prInfo, checkStatus } = message;
    
    // Store the tab ID for this PR
    if (sender.tab) {
      prTabs.set(prInfo.url, sender.tab.id);
    }

    // Determine notification message
    let title = '';
    let messageText = '';
    
    if (checkStatus.hasFailed) {
      title = '❌ PR Checks Failed';
      messageText = `${checkStatus.failed} check(s) failed in ${prInfo.owner}/${prInfo.repo}#${prInfo.number}`;
    } else if (checkStatus.allComplete) {
      title = '✅ All PR Checks Passed';
      messageText = `All ${checkStatus.total} check(s) passed in ${prInfo.owner}/${prInfo.repo}#${prInfo.number}`;
    }

    if (title) {
      // Create notification
      const notificationId = `pr-${prInfo.owner}-${prInfo.repo}-${prInfo.number}`;
      
      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: title,
        message: messageText,
        priority: 2,
        requireInteraction: false
      });

      // Store PR URL with notification ID
      chrome.storage.local.set({
        [notificationId]: prInfo.url
      });
    }
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Get the PR URL from storage
  chrome.storage.local.get([notificationId], (result) => {
    const prUrl = result[notificationId];
    
    if (prUrl) {
      // Try to focus the existing tab
      const tabId = prTabs.get(prUrl);
      
      if (tabId) {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            // Tab doesn't exist anymore, create a new one
            chrome.tabs.create({ url: prUrl });
          } else {
            // Focus the existing tab
            chrome.tabs.update(tabId, { active: true });
            chrome.windows.update(tab.windowId, { focused: true });
          }
        });
      } else {
        // No tab ID stored, create a new tab
        chrome.tabs.create({ url: prUrl });
      }
    }
    
    // Clear the notification
    chrome.notifications.clear(notificationId);
  });
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  // Remove the tab from our map
  for (const [url, id] of prTabs.entries()) {
    if (id === tabId) {
      prTabs.delete(url);
      break;
    }
  }
});
