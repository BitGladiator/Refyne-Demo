document.addEventListener("DOMContentLoaded", async function () {
  const toggle = document.getElementById("toggleEnabled");
  const statusDiv = document.getElementById("status");
  const correctionsCount = document.getElementById("correctionsCount");
  const wordsImproved = document.getElementById("wordsImproved");
  const modeIndicator = document.getElementById("modeIndicator");
  const toggleTTS = document.getElementById("toggleTTS");
  const summarizeBtn = document.getElementById("summarizeBtn");
  const summaryContainer = document.getElementById("summaryContainer");
  const summaryText = document.getElementById("summaryText");
  const summaryPlaceholder = document.getElementById("summaryPlaceholder");
  const copySummaryBtn = document.getElementById("copySummary");
  const closeSummaryBtn = document.getElementById("closeSummary");
  const progressBar = document.querySelector(".progress-bar");
  const progressFill = document.querySelector(".progress-bar-fill");
  const customExpansions = document.getElementById("customExpansions");
  const toggleExpander = document.getElementById("toggleExpander");
  chrome.storage.local.get(
    ["enabled", "correctionsCount", "wordsImproved"],
    (result) => {
      toggle.checked = result.enabled !== false;
      correctionsCount.textContent = result.correctionsCount || 0;
      wordsImproved.textContent = result.wordsImproved || 0;
      updateExtensionBadge(toggle.checked);
    }
  );
  
  chrome.storage.sync.get(["enableTTS"], (result) => {
    toggleTTS.checked = result.enableTTS !== false;
  });
  chrome.storage.sync.get(["enableExpander", "customExpansions"], (result) => {
    toggleExpander.checked = result.enableExpander || false;
    if (result.customExpansions) {
        customExpansions.value = result.customExpansions;
    }
  });
  toggleTTS.addEventListener("change", function () {
    chrome.storage.sync.set({ enableTTS: this.checked });
  });

  toggleExpander.addEventListener("change", function() {
    chrome.storage.sync.set({ 
        enableExpander: this.checked 
    });
  });

  customExpansions.addEventListener("change", function() {
    chrome.storage.sync.set({ 
      customExpansions: this.value 
    }, () => {
      console.log('Saved custom expansions:', this.value);
    });
  });
  customExpansions.addEventListener("blur", function() {
    chrome.storage.sync.set({ 
      customExpansions: this.value 
    }, () => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && tab.url.startsWith('http')) {
            chrome.tabs.sendMessage(tab.id, {
              action: "reloadExpanderSettings"
            }).catch(err => console.log("Tab reload failed:", err));
          }
        });
      });
    });
  });
  
  toggle.addEventListener("change", function () {
    const isEnabled = this.checked;
    chrome.storage.local.set({ enabled: isEnabled }, () => {
      updateExtensionBadge(isEnabled);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "enabledStateChanged",
            enabled: isEnabled,
          }).catch((err) => console.log("Tab message failed:", err));
        }
      });
    });
  });

  summarizeBtn.addEventListener("click", async function() {
    try {
      summarizeBtn.disabled = true;
      summarizeBtn.classList.add('loading');
      summarizeBtn.innerHTML = `
        <svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" opacity="0.3"/>
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
        <span>Summarizing...</span>
      `;
      progressBar.classList.add('active');
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        progressFill.style.width = `${progress}%`;
        if (progress >= 90) clearInterval(progressInterval);
      }, 100);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error("No active tab found");
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        action: "summarizePage"
      });
      clearInterval(progressInterval);
      progressFill.style.width = '100%';

      setTimeout(() => {
        if (response && response.summary) {
          summaryText.textContent = response.summary;
          summaryPlaceholder.style.display = 'none';
          summaryText.style.display = 'block';
          summaryContainer.classList.add('show');
        } else if (response && response.error) {
          summaryText.textContent = response.error;
          summaryPlaceholder.style.display = 'none';
          summaryText.style.display = 'block';
          summaryContainer.classList.add('show');
        } else {
          throw new Error("Failed to generate summary");
        }
        resetSummarizeButton();
        progressBar.classList.remove('active');
        progressFill.style.width = '0%';
      }, 300);

    } catch (error) {
      console.error("Summarization error:", error);
      summaryText.textContent = "Unable to summarize this page. Please try again or ensure the page has content to summarize.";
      summaryPlaceholder.style.display = 'none';
      summaryText.style.display = 'block';
      summaryContainer.classList.add('show');
      resetSummarizeButton();
      progressBar.classList.remove('active');
      progressFill.style.width = '0%';
    }
  });

  copySummaryBtn.addEventListener("click", function() {
    if (summaryText.textContent) {
      navigator.clipboard.writeText(summaryText.textContent).then(() => {
        const originalTitle = copySummaryBtn.getAttribute('title');
        copySummaryBtn.setAttribute('title', 'Copied!');
        copySummaryBtn.innerHTML = `
          <svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        `;
        
        setTimeout(() => {
          copySummaryBtn.setAttribute('title', originalTitle);
          copySummaryBtn.innerHTML = `
            <svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          `;
        }, 2000);
      });
    }
  });

  closeSummaryBtn.addEventListener("click", function() {
    summaryContainer.classList.remove('show');
    summaryPlaceholder.style.display = 'block';
    summaryText.style.display = 'none';
  });

  checkAIStatus();

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.correctionsCount) {
        correctionsCount.textContent = changes.correctionsCount.newValue || 0;
      }
      if (changes.wordsImproved) {
        wordsImproved.textContent = changes.wordsImproved.newValue || 0;
      }
    }
  });

  function resetSummarizeButton() {
    summarizeBtn.disabled = false;
    summarizeBtn.classList.remove('loading');
    summarizeBtn.innerHTML = `
      <svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>
      <span>Summarize This Page</span>
    `;
  }

  async function checkAIStatus() {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      
      if (tabs[0] && tabs[0].id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: "getAIStatus",
        });

        if (response) {
          updateStatus(response.status, response.message, response.mode);
          return;
        }
      }
    } catch (error) {
      console.log("Could not get AI status from content script:", error);
    }
    
    const hasAISupport = await checkSystemAISupport();
    if (hasAISupport) {
      updateStatus("available", "AI Model Ready", "ai");
    } else {
      updateStatus("unavailable", "AI Not Supported - Using Offline Mode", "offline");
    }
  }

  async function checkSystemAISupport() {
    const chromeVersion = navigator.userAgent.match(/Chrome\/([0-9]+)/)?.[1];
    if (!chromeVersion || parseInt(chromeVersion) < 137) {
      return false;
    }
    
    const userAgent = navigator.userAgent;
    const isSupportedOS =
      userAgent.includes("Windows") ||
      userAgent.includes("Mac OS") ||
      userAgent.includes("Linux") ||
      userAgent.includes("CrOS");

    return isSupportedOS;
  }

  function updateStatus(status, message, mode) {
    if (modeIndicator) {
      const iconSvg = mode === "offline" 
        ? '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>'
        : '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 17.2l-6.4 4 2.4-7.2-6-4.8h7.6z"/></svg>';
      
      modeIndicator.innerHTML = `${iconSvg}<span>${mode === "offline" ? "Offline" : "AI"} Mode</span>`;
      
      if (mode === "offline") {
        modeIndicator.classList.remove('online');
      } else {
        modeIndicator.classList.add('online');
      }
    }
    
    let statusIcon, statusClass;
    switch (status) {
      case "available":
        statusIcon = '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6L9 17l-5-5"/></svg>';
        statusClass = "status ready";
        break;
      case "downloading":
      case "downloadable":
        statusIcon = '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z"/><path d="M12 6v6l4 2"/></svg>';
        statusClass = "status downloading";
        break;
      case "unavailable":
      default:
        statusIcon = '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
        statusClass = "status error";
        break;
    }

    statusDiv.className = statusClass;
    statusDiv.innerHTML = `${statusIcon}<span>${message}</span>`;
  }

  function updateExtensionBadge(isEnabled) {
    chrome.action.setBadgeText({ text: isEnabled ? "ON" : "OFF" });
    chrome.action.setBadgeBackgroundColor({
      color: isEnabled ? "#6366F1" : "#9CA3AF",
    });
  }
});