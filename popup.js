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

  toggleTTS.addEventListener("change", function () {
    chrome.storage.sync.set({ enableTTS: this.checked });
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
        <svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.3"/>
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" stroke-width="3" fill="none"/>
        </svg>
        <span>Summarizing...</span>
      `;

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error("No active tab found");
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        action: "summarizePage"
      });

      if (response && response.summary) {
        summaryText.textContent = response.summary;
        summaryContainer.classList.add('show');
      } else if (response && response.error) {
        summaryText.textContent = response.error;
        summaryContainer.classList.add('show');
      } else {
        throw new Error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Summarization error:", error);
      summaryText.textContent = "Unable to summarize this page. Please try again or ensure the page has content to summarize.";
      summaryContainer.classList.add('show');
    } finally {
      summarizeBtn.disabled = false;
      summarizeBtn.classList.remove('loading');
      summarizeBtn.innerHTML = `
        <svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        <span>Summarize This Page</span>
      `;
    }
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
        ? '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 6v6m0 4h.01"/></svg>'
        : '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 17.2l-6.4 4 2.4-7.2-6-4.8h7.6z"/></svg>';
      
      modeIndicator.innerHTML = `${iconSvg}<span>${mode === "offline" ? "Offline" : "AI"} Mode</span>`;
      
      if (mode === "offline") {
        modeIndicator.style.background = "linear-gradient(135deg, #FEF3C7, #FDE68A)";
        modeIndicator.style.color = "#92400E";
        modeIndicator.style.borderColor = "#F59E0B";
      } else {
        modeIndicator.style.background = "linear-gradient(135deg, #D1FAE5, #A7F3D0)";
        modeIndicator.style.color = "#065F46";
        modeIndicator.style.borderColor = "#10B981";
      }
    }
    
    let statusIcon, statusClass;
    switch (status) {
      case "available":
        statusIcon = '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 8px;"><path d="M20 6L9 17l-5-5"/></svg>';
        statusClass = "status ready";
        break;
      case "downloading":
      case "downloadable":
        statusIcon = '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 8px;"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z"/><path d="M12 6v6l4 2"/></svg>';
        statusClass = "status downloading";
        break;
      case "unavailable":
      default:
        statusIcon = '<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 8px;"><path d="M12 2L2 22h20L12 2zm0 6v6m0 4h.01"/></svg>';
        statusClass = "status error";
        break;
    }

    statusDiv.className = statusClass;
    statusDiv.innerHTML = `${statusIcon}${message}`;
  }

  function updateExtensionBadge(isEnabled) {
    chrome.action.setBadgeText({ text: isEnabled ? "ON" : "OFF" });
    chrome.action.setBadgeBackgroundColor({
      color: isEnabled ? "#6366F1" : "#9CA3AF",
    });
  }

  chrome.storage.local.get(["correctionsCount", "wordsImproved"], (result) => {
    correctionsCount.textContent = result.correctionsCount || 0;
    wordsImproved.textContent = result.wordsImproved || 0;
  });
});