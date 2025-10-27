console.log("Refyne content script loaded");

let debounceTimeout = null;
let activeTarget = null;
let activeSuggestion = null;
let isEnabled = true;
let tooltipManager = null;
let aiEngine = null;
let textAnalyzer = null;

function getTextFromElement(el) {
    if (el.isContentEditable) return el.textContent || el.innerText || "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value || "";
    return "";
}
let isApplyingSuggestion = false;
function applySuggestion(target, original, corrected) {
    const currentText = getTextFromElement(target);
    if (!currentText.includes(original)) return false;

    try {
        isApplyingSuggestion = true;
        
        if (target.isContentEditable) {
            target.textContent = currentText.replace(original, corrected);
            target.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            target.value = currentText.replace(original, corrected);
            const pos = currentText.indexOf(original) + corrected.length;
            target.setSelectionRange(pos, pos);
            target.dispatchEvent(new Event('input', { bubbles: true }));
        }

        chrome.runtime.sendMessage({ 
            action: 'correctionApplied', 
            original, 
            corrected,
            source: aiEngine.isOfflineMode() ? 'offline' : 'ai'
        }).catch(err => console.log('Background message failed:', err));
        
        tooltipManager.showStatus("Suggestion applied!", "success");
        setTimeout(() => tooltipManager.hideStatus(), 2000);
        isApplyingSuggestion = false;
        return true;
    } catch (error) {
        isApplyingSuggestion = false;
        console.error("Failed to apply suggestion:", error);
        tooltipManager.showStatus("Failed to apply suggestion", "error");
        setTimeout(() => tooltipManager.hideStatus(), 2000);
        return false;
    }
}

async function handleInput(e) {
    if (isApplyingSuggestion) return;
    const target = e.target;
    const isEditable = target.isContentEditable || 
                      target.tagName === "TEXTAREA" || 
                      (target.tagName === "INPUT" && ['text','email','search','url','textarea'].includes(target.type));

    if (!isEditable || !isEnabled) return;
    
    tooltipManager.hide();
    clearTimeout(debounceTimeout);
    
    debounceTimeout = setTimeout(async () => {
        const text = getTextFromElement(target);
        if (!text || text.trim().length < 3) return;

        try {
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({ action: 'checkEnabled' }, resolve);
            });
            isEnabled = response?.enabled !== false;
        } catch (err) {
            isEnabled = true;
        }

        if (!isEnabled) return;

        const suggestion = await aiEngine.getSuggestions(text);
        if (!suggestion) return;

        activeTarget = target;
        activeSuggestion = suggestion;

        const insights = textAnalyzer.analyzeText(text);
        
        tooltipManager.showWithInsights(
            target,
            suggestion,
            insights,
            () => {
                applySuggestion(target, suggestion.original, suggestion.corrected);
                activeTarget = null;
                activeSuggestion = null;
            }
        );
    }, 2000);
}
let isInitialized = false;
async function init() {
    if (isInitialized) return;
    isInitialized = true;
    console.log("Refyne content script initializing...");
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
        textAnalyzer = new window.TextAnalyzer();
        aiEngine = new window.AIEngine();
        tooltipManager = new window.TooltipManager();
    } catch (error) {
        console.error("Failed to initialize components:", error);
        return;
    }
    
    try {
        const response = await new Promise(resolve => {
            chrome.storage.sync.get(['enableExtension'], resolve);
        });
        isEnabled = response?.enableExtension !== false;
    } catch (err) {
        console.error("Error checking enabled state:", err);
        isEnabled = true;
    }
    
    await aiEngine.initialize();
    
    console.log("Refyne initialized successfully!");
    console.log("AI Mode:", aiEngine.isAIAvailable() ? "Active" : "Unavailable");
    console.log("Offline Mode:", aiEngine.isOfflineMode() ? "Active" : "Inactive");
    
    function hideTooltipOnClick(e) {
        if (!tooltipManager.contains(e.target)) {
            tooltipManager.hide();
        }
    }
    
    function hideTooltipOnScroll(e) {
        if (tooltipManager.contains(e.target)) {
            return;
        }
        tooltipManager.hide();
    }
    
    document.removeEventListener("input", handleInput, true);
    document.removeEventListener("click", hideTooltipOnClick, true);
    document.removeEventListener("scroll", hideTooltipOnScroll, true);
    
    document.addEventListener("input", handleInput, true);
    document.addEventListener("click", hideTooltipOnClick, true);
    document.addEventListener("scroll", hideTooltipOnScroll, true);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enabledStateChanged') {
        isEnabled = request.enabled;
        if (!isEnabled) {
            tooltipManager.hide();
            aiEngine.stopSpeaking();
        }
        tooltipManager.showStatus(
            isEnabled ? "Refyne enabled" : "Refyne disabled", 
            isEnabled ? "success" : "warning"
        );
        setTimeout(() => tooltipManager.hideStatus(), 2000);
    }
    
    if (request.action === 'showTextInsights' && request.text) {
        const insights = textAnalyzer.analyzeText(request.text);
        tooltipManager.showInsightsOnly(request.text, insights);
    }
    
    if (request.action === 'getAIStatus') {
        aiEngine.getStatus().then(status => sendResponse(status));
        return true;
    }
    
    if (request.action === 'checkText' && request.text) {
        tooltipManager.showStatus("Checking selected text...", "info");
        aiEngine.getSuggestions(request.text).then(suggestion => {
            if (suggestion) {
                tooltipManager.showCenteredSuggestion(suggestion, request.text);
            } else {
                tooltipManager.showStatus("No suggestions available", "info");
                setTimeout(() => tooltipManager.hideStatus(), 3000);
            }
        });
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}