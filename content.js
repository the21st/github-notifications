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
  let status = {
    hasPending: false,
    hasFailed: false,
    hasSuccess: false,
    checksExist: false
  };
  
  // Primary approach: Look for the merge box section headings
  // Scope to merge box area to avoid false matches from PR description
  const mergeBoxArea = document.querySelector('.merge-status-list, .merge-msg, [data-testid="mergeability-status"]');
  
  if (mergeBoxArea) {
    const headings = mergeBoxArea.querySelectorAll('h3, h4');
    
    headings.forEach(heading => {
      const text = heading.textContent.trim().toLowerCase();
      
      // Check for various status messages (case-insensitive, broader matching)
      if (text.includes("haven't completed") || 
          text.includes("in progress") ||
          text.includes("waiting for") ||
          text.includes("checks are pending") ||
          text.includes("expected")) {
        status.hasPending = true;
        status.checksExist = true;
      } else if (text.includes("failing") || 
                 text.includes("failed") ||
                 text.includes("not successful") ||
                 text.includes("were unsuccessful")) {
        status.hasFailed = true;
        status.checksExist = true;
      } else if (text.includes("successful") || 
                 text.includes("passed") ||
                 text.includes("all checks have passed") ||
                 text.includes("checks passed")) {
        status.hasSuccess = true;
        status.checksExist = true;
      }
    });
  }
  
  // Fallback 1: Try the detailed checks view with data-testid
  if (!status.checksExist) {
    const detailsContainer = document.querySelector('[data-testid="status-checks"]');
    if (detailsContainer) {
      const checkItems = detailsContainer.querySelectorAll('[data-testid="status-check-item"]');
      let totalChecks = checkItems.length;
      
      if (totalChecks > 0) {
        status.checksExist = true;
      }
      
      let completedChecks = 0;
      let failedChecks = 0;
      
      checkItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        
        if (text.includes('success') || item.querySelector('[data-status="success"]')) {
          completedChecks++;
        } else if (text.includes('fail') || item.querySelector('[data-status="failure"]')) {
          completedChecks++;
          failedChecks++;
        }
      });
      
      if (failedChecks > 0) {
        status.hasFailed = true;
      }
      
      if (totalChecks > 0 && completedChecks === totalChecks) {
        if (failedChecks === 0) {
          status.hasSuccess = true;
        }
      } else if (completedChecks < totalChecks) {
        status.hasPending = true;
      }
    }
  }
  
  // Fallback 2: Legacy merge-status-item approach
  if (!status.checksExist) {
    const checkItems = document.querySelectorAll('.merge-status-item');
    
    if (checkItems.length > 0) {
      let hasChecks = false;
      
      checkItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        
        if (text.includes('check') || text.includes('continuous integration') || text.includes('status check')) {
          hasChecks = true;
          status.checksExist = true;
          
          if (text.includes('successful') || text.includes('passed')) {
            status.hasSuccess = true;
          } else if (text.includes('failed') || text.includes('failing')) {
            status.hasFailed = true;
          } else if (text.includes('pending') || text.includes('in progress') || text.includes('expected')) {
            status.hasPending = true;
          }
        }
      });
    }
  }
  
  if (!status.checksExist) {
    return null;
  }
  
  return {
    hasFailed: status.hasFailed,
    allComplete: (status.hasSuccess || status.hasFailed) && !status.hasPending,
    pending: status.hasPending
  };
}

// Function to check and notify about status changes
function checkAndNotify() {
  if (!isPRPage()) {
    return;
  }

  const prInfo = getPRInfo();
  const checkStatus = getCheckStatus();

  if (!checkStatus) {
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
  if (checkStatus.pending && !checkStatus.allComplete) {
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
