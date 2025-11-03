// Content script that runs on GitHub PR pages

let lastCheckState = null;
let notificationSent = false;
let checkInterval = null;

// Function to check if we're on a PR page
function isPRPage() {
  const path = window.location.pathname;
  return /^\/[^/]+\/[^/]+\/pull\/\d+/.test(path);
}

// Function to get PR information
function getPRInfo() {
  const path = window.location.pathname;
  const match = path.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      number: match[3],
      url: window.location.href
    };
  }
  return null;
}

// Function to parse check status from the GitHub UI
function getCheckStatus() {
  // Look for the checks summary in the PR page
  const mergeBox = document.querySelector('.merge-status-list');
  if (!mergeBox) {
    return null;
  }

  // Try to find check status indicators
  const checkItems = document.querySelectorAll('.merge-status-item');
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let pendingChecks = 0;

  checkItems.forEach(item => {
    // Look for status indicators
    const statusIcon = item.querySelector('svg');
    const text = item.textContent.toLowerCase();
    
    // Check for "checks" or "continuous integration" items
    if (text.includes('check') || text.includes('continuous integration') || text.includes('status check')) {
      totalChecks++;
      
      // Check the status by looking at SVG classes or aria-labels
      if (item.querySelector('[data-test-selector="status-checks-success"]') || 
          text.includes('successful') || 
          text.includes('passed') ||
          statusIcon?.classList.contains('text-green')) {
        passedChecks++;
      } else if (item.querySelector('[data-test-selector="status-checks-failure"]') || 
                 text.includes('failed') || 
                 text.includes('failing') ||
                 statusIcon?.classList.contains('text-red')) {
        failedChecks++;
      } else if (text.includes('pending') || 
                 text.includes('in progress') || 
                 text.includes('expected') ||
                 statusIcon?.classList.contains('text-yellow')) {
        pendingChecks++;
      }
    }
  });

  // Alternative: Check the new GitHub UI with status-checks
  const statusChecksSection = document.querySelector('[data-testid="status-checks"]');
  if (statusChecksSection && totalChecks === 0) {
    const checkRuns = statusChecksSection.querySelectorAll('[data-testid="status-check-item"]');
    
    checkRuns.forEach(check => {
      totalChecks++;
      const text = check.textContent.toLowerCase();
      
      if (check.querySelector('.octicon-check, .octicon-check-circle') || text.includes('success')) {
        passedChecks++;
      } else if (check.querySelector('.octicon-x, .octicon-x-circle') || text.includes('fail')) {
        failedChecks++;
      } else {
        pendingChecks++;
      }
    });
  }

  // Look for the new merge-checks section
  const mergeChecks = document.querySelector('.merge-status-checks');
  if (mergeChecks && totalChecks === 0) {
    const checks = mergeChecks.querySelectorAll('.branch-action-item');
    
    checks.forEach(check => {
      const statusIcon = check.querySelector('.branch-action-state-icon');
      if (statusIcon) {
        totalChecks++;
        
        if (statusIcon.classList.contains('bg-green') || 
            check.querySelector('.octicon-check')) {
          passedChecks++;
        } else if (statusIcon.classList.contains('bg-red') || 
                   check.querySelector('.octicon-x')) {
          failedChecks++;
        } else {
          pendingChecks++;
        }
      }
    });
  }

  return {
    total: totalChecks,
    passed: passedChecks,
    failed: failedChecks,
    pending: pendingChecks,
    allComplete: totalChecks > 0 && (passedChecks + failedChecks) === totalChecks,
    hasFailed: failedChecks > 0
  };
}

// Function to check and notify about status changes
function checkAndNotify() {
  if (!isPRPage()) {
    return;
  }

  const prInfo = getPRInfo();
  const checkStatus = getCheckStatus();

  if (!checkStatus || checkStatus.total === 0) {
    return;
  }

  const currentState = JSON.stringify(checkStatus);
  
  // Check if state has changed
  if (lastCheckState === currentState) {
    return;
  }

  lastCheckState = currentState;

  // Send notification if checks failed or all completed
  if ((checkStatus.hasFailed || checkStatus.allComplete) && !notificationSent) {
    chrome.runtime.sendMessage({
      type: 'CHECK_STATUS_CHANGE',
      prInfo: prInfo,
      checkStatus: checkStatus
    });
    notificationSent = true;
  }

  // Reset notification flag when checks are pending again
  if (checkStatus.pending > 0 && !checkStatus.allComplete) {
    notificationSent = false;
  }
}

// Start monitoring when page loads
function startMonitoring() {
  if (!isPRPage()) {
    return;
  }

  // Initial check
  setTimeout(checkAndNotify, 2000);

  // Poll every 10 seconds
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  checkInterval = setInterval(checkAndNotify, 10000);
}

// Listen for page changes (GitHub uses PJAX)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    lastCheckState = null;
    notificationSent = false;
    startMonitoring();
  }
}).observe(document, { subtree: true, childList: true });

// Start monitoring
startMonitoring();
