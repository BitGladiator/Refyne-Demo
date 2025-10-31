class TooltipManager {
  constructor() {
    this.tooltip = null;
    this.statusDiv = null;
    this.textAnalyzer = new window.TextAnalyzer();
    this.initializeTooltip();
    this.initializeStyles();
  }

  initializeTooltip() {
    this.tooltip = document.createElement("div");
    Object.assign(this.tooltip.style, {
      position: "fixed",
      border: "1px solid #E0E7FF",
      padding: "0",
      borderRadius: "10px",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      zIndex: "2147483647",
      display: "none",
      fontSize: "12px",
      maxWidth: "380px",
      minWidth: "320px",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      lineHeight: "1.4",
      background: "#FFFFFF",
      overflow: "hidden",
    });
    this.tooltip.id = "refyne-tooltip";
    document.body.appendChild(this.tooltip);
  }

  getSVGIcon(type) {
    const icons = {
      sparkle:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 17.2l-6.4 4 2.4-7.2-6-4.8h7.6z"/></svg>',
      chart:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
      speaker:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>',
      lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01" stroke="white" stroke-width="2"/></svg>',
      check:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>',
      alert:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 6v6m0 4h.01"/></svg>',
      warning:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>',
      lightbulb:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21h6m-4-18a6 6 0 016 6c0 2-1 4-3 5v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2c-2-1-3-3-3-5a6 6 0 016-6z"/></svg>',
      alertCircle:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" stroke="white" stroke-width="2"/></svg>',
      close:
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
      expander:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    };
    return icons[type] || "";
  }

  initializeStyles() {
    const animationStyles = document.createElement("style");
    animationStyles.textContent = `
      @keyframes refyneSlideIn {
        from { 
          opacity: 0; 
          transform: translateY(-10px) scale(0.95);
        }
        to { 
          opacity: 1; 
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes refyneFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* New animations for tone loading */
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }

      @keyframes toneSlideIn {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes bounceIn {
        0% {
          opacity: 0;
          transform: scale(0.3);
        }
        50% {
          opacity: 1;
          transform: scale(1.05);
        }
        70% {
          transform: scale(0.9);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
      }
      
      #refyne-tooltip {
        animation: refyneSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto !important;
      }
      
      .refyne-tab-content {
        animation: refyneFadeIn 0.15s ease-out;
        pointer-events: auto !important;
      }
      
      .refyne-listen-btn {
        transition: all 0.2s ease;
      }
      
      .refyne-tone-btn {
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        position: relative;
        overflow: hidden;
      }

      .refyne-tone-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        transition: left 0.5s;
      }

      .refyne-tone-btn:hover::before {
        left: 100%;
      }

      .refyne-tone-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .refyne-tone-btn.active {
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        transform: translateY(-1px);
      }
      
      /* Rest of your existing styles remain the same */
      .refyne-listen-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }
      
      .refyne-close-btn {
        transition: all 0.2s ease;
        opacity: 0.7;
      }
      
      .refyne-close-btn:hover {
        opacity: 1;
        transform: scale(1.1);
        background: rgba(0, 0, 0, 0.05);
      }
      
      .refyne-listen-btn-small {
        transition: all 0.2s ease;
        padding: 8px 10px !important;
        min-width: auto !important;
      }
      
      .refyne-listen-btn-small:hover {
        transform: translateY(-1px) scale(1.05);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) !important;
      }
      
     .refyne-tab-button {
        flex: 1;
        padding: 10px 12px !important;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #6B7280;
        font-size: 12px !important;
        font-weight: 500;
        transition: all 0.2s ease;
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      
      .refyne-tab-button::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #6366F1, #8B5CF6);
        transform: scaleX(0);
        transition: transform 0.2s ease;
        border-radius: 3px 3px 0 0;
      }
      
      .refyne-tab-button:hover {
        background: #F9FAFB;
        color: #374151;
      }
      
      .refyne-tab-button.active {
        color: #6366F1;
        font-weight: 600;
        background: linear-gradient(to bottom, #F5F3FF, transparent);
      }
      
      .refyne-tab-button.active::after {
        transform: scaleX(1);
      }
      
       .refyne-tab-content {
        animation: refyneFadeIn 0.15s ease-out;
        pointer-events: auto !important;
        max-height: 45vh !important;
        overflow-y: auto;
        padding: 12px !important;
      }
      
       .refyne-suggestions-content {
        max-height: none !important;
        overflow-y: visible !important;
        padding-right: 0 !important;
      }
      
      .refyne-suggestions-content::-webkit-scrollbar {
        width: 6px;
      }
      
      .refyne-suggestions-content::-webkit-scrollbar-track {
        background: #F3F4F6;
        border-radius: 3px;
        margin: 4px 0;
      }
      
      .refyne-suggestions-content::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #C7D2FE, #A5B4FC);
        border-radius: 3px;
        border: 1px solid #F3F4F6;
      }
      
      .refyne-suggestions-content::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #A5B4FC, #818CF8);
      }
      
      .refyne-tab-content::-webkit-scrollbar {
        width: 8px;
      }
      
      .refyne-tab-content::-webkit-scrollbar-track {
        background: #F3F4F6;
        border-radius: 4px;
        margin: 8px 0;
      }
      
      .refyne-tab-content::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #C7D2FE, #A5B4FC);
        border-radius: 4px;
        border: 2px solid #F3F4F6;
      }
      
      .refyne-tab-content::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #A5B4FC, #818CF8);
      }
      
      .refyne-metric-card {
        transition: all 0.2s ease;
      }
      
      .refyne-metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .refyne-tone-badge {
        transition: all 0.2s ease;
      }
      
      .refyne-tone-badge:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    `;
    document.head.appendChild(animationStyles);
  }

  positionTooltip(targetElement) {
    this.tooltip.style.display = "block";
    this.tooltip.style.visibility = "hidden";

    const tooltipRect = this.tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    const targetRect = targetElement.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = targetRect.left + scrollX;
    let top = targetRect.bottom + scrollY + 10;

    const centerOffset = (targetRect.width - tooltipWidth) / 2;
    left += centerOffset;

    if (left + tooltipWidth > viewportWidth + scrollX - 20) {
      left = viewportWidth + scrollX - tooltipWidth - 20;
    }
    if (left < scrollX + 20) {
      left = scrollX + 20;
    }

    const spaceBelow = viewportHeight - (targetRect.bottom - scrollY);
    const spaceAbove = targetRect.top - scrollY;

    if (spaceBelow < tooltipHeight + 20 && spaceAbove > tooltipHeight + 20) {
      top = targetRect.top + scrollY - tooltipHeight - 10;
    }

    if (top + tooltipHeight > viewportHeight + scrollY - 20) {
      top = viewportHeight + scrollY - tooltipHeight - 20;
    }
    if (top < scrollY + 20) {
      top = scrollY + 20;
    }

    this.tooltip.style.left = Math.round(left) + "px";
    this.tooltip.style.top = Math.round(top) + "px";
    this.tooltip.style.visibility = "visible";
  }

  positionCenter() {
    this.tooltip.style.display = "block";
    this.tooltip.style.visibility = "hidden";
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const left = Math.max(
      20,
      (window.innerWidth - tooltipRect.width) / 2 + window.scrollX
    );
    const top = Math.max(
      20,
      (window.innerHeight - tooltipRect.height) / 2 + window.scrollY
    );
    this.tooltip.style.left = left + "px";
    this.tooltip.style.top = top + "px";
    this.tooltip.style.visibility = "visible";
  }

  generateInsightsHTML(insights) {
    if (!insights)
      return `
        <div style="text-align: center; padding: 40px 16px; color: #9CA3AF;">
          <div style="margin-bottom: 12px;">${this.getSVGIcon("chart")}</div>
          <div style="font-size: 14px; font-weight: 600; color: #6B7280; margin-bottom: 6px;">No insights available</div>
          <div style="font-size: 12px; color: #9CA3AF;">Write more text to get detailed analysis</div>
        </div>
      `;

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
        <!-- Compact Metrics Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px;">
          <div class="refyne-metric-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px; border-radius: 8px; color: white; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 2px;">${
              insights.wordCount
            }</div>
            <div style="font-size: 9px; opacity: 0.9; letter-spacing: 0.5px; text-transform: uppercase;">Words</div>
          </div>
          <div class="refyne-metric-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 12px; border-radius: 8px; color: white; box-shadow: 0 2px 4px rgba(240, 147, 251, 0.3);">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 2px;">${
              insights.sentenceCount
            }</div>
            <div style="font-size: 9px; opacity: 0.9; letter-spacing: 0.5px; text-transform: uppercase;">Sentences</div>
          </div>
          <div class="refyne-metric-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 12px; border-radius: 8px; color: white; box-shadow: 0 2px 4px rgba(79, 172, 254, 0.3);">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 2px;">${
              insights.readingTime
            }<span style="font-size: 14px;">min</span></div>
            <div style="font-size: 9px; opacity: 0.9; letter-spacing: 0.5px; text-transform: uppercase;">Read Time</div>
          </div>
          <div class="refyne-metric-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 12px; border-radius: 8px; color: white; box-shadow: 0 2px 4px rgba(67, 233, 123, 0.3);">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 2px;">${
              insights.readability
            }<span style="font-size: 14px;">%</span></div>
            <div style="font-size: 9px; opacity: 0.9; letter-spacing: 0.5px; text-transform: uppercase;">Readability</div>
          </div>
        </div>

        ${
          insights.tone.length > 0
            ? `
          <div style="margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="background: linear-gradient(135deg, #667eea, #764ba2); width: 3px; height: 16px; border-radius: 2px; margin-right: 8px;"></div>
              <div style="font-weight: 700; color: #1F2937; font-size: 11px; letter-spacing: 0.3px; text-transform: uppercase;">Writing Tone</div>
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${insights.tone
                .map(
                  (tone) => `
                <div class="refyne-tone-badge" style="background: ${this.textAnalyzer.getToneColor(
                  tone.name
                )}; color: white; padding: 6px 10px; border-radius: 16px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">
                  <span>${tone.name}</span>
                  <span style="opacity: 0.85; font-size: 9px; background: rgba(255,255,255,0.2); padding: 1px 4px; border-radius: 8px;">${
                    tone.score
                  }%</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        ${
          insights.issues.length > 0
            ? `
          <div style="margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="background: linear-gradient(135deg, #f093fb, #f5576c); width: 3px; height: 16px; border-radius: 2px; margin-right: 8px;"></div>
              <div style="font-weight: 700; color: #1F2937; font-size: 11px; letter-spacing: 0.3px; text-transform: uppercase;">Improvement Areas</div>
            </div>
            <div style="background: linear-gradient(135deg, #FFFBEB, #FEF3C7); border: 1px solid #FDE68A; border-radius: 6px; padding: 10px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              ${insights.issues
                .map(
                  (issue, index) => `
                <div style="display: flex; align-items: start; margin-bottom: ${
                  index === insights.issues.length - 1 ? "0" : "6px"
                };">
                  <span style="color: #F59E0B; margin-right: 6px; margin-top: 1px; width: 12px; height: 12px;">${this.getSVGIcon(
                    "alertCircle"
                  )}</span>
                  <span style="color: #92400E; font-size: 11px; line-height: 1.4; font-weight: 500;">${issue}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        ${
          insights.suggestions.length > 0
            ? `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="background: linear-gradient(135deg, #43e97b, #38f9d7); width: 3px; height: 16px; border-radius: 2px; margin-right: 8px;"></div>
              <div style="font-weight: 700; color: #1F2937; font-size: 11px; letter-spacing: 0.3px; text-transform: uppercase;">Writing Tips</div>
            </div>
            <div style="background: linear-gradient(135deg, #ECFDF5, #D1FAE5); border: 1px solid #A7F3D0; border-radius: 6px; padding: 10px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              ${insights.suggestions
                .map(
                  (tip, index) => `
                <div style="display: flex; align-items: start; margin-bottom: ${
                  index === insights.suggestions.length - 1 ? "0" : "6px"
                };">
                  <span style="color: #10B981; margin-right: 6px; margin-top: 1px; width: 12px; height: 12px;">${this.getSVGIcon(
                    "lightbulb"
                  )}</span>
                  <span style="color: #065F46; font-size: 11px; line-height: 1.4; font-weight: 500;">${tip}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Compact Footer Stats -->
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #F3F4F6; display: flex; justify-content: space-around; text-align: center;">
          <div>
            <div style="font-size: 16px; font-weight: 700; color: #6366F1;">${
              insights.avgSentenceLength
            }</div>
            <div style="font-size: 9px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Avg Words/Sentence</div>
          </div>
          <div style="width: 1px; background: #E5E7EB;"></div>
          <div>
            <div style="font-size: 16px; font-weight: 700; color: #8B5CF6;">${
              insights.paragraphCount
            }</div>
            <div style="font-size: 9px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Paragraphs</div>
          </div>
        </div>
      </div>
    `;
  }

  async showWithInsights(targetElement, suggestion, insights, applyCallback) {
    const source = suggestion.source || "ai";
    // In the showWithInsights method, update the header section
    const isExpander = suggestion.source === "expander";
    const titleColor = isExpander
      ? "#8B5CF6"
      : source === "offline"
      ? "#F59E0B"
      : "#10B981";
    const titleBg = isExpander
      ? "linear-gradient(135deg, #EDE9FE, #DDD6FE)"
      : source === "offline"
      ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
      : "linear-gradient(135deg, #D1FAE5, #A7F3D0)";
    const titleIcon = isExpander
      ? this.getSVGIcon("expander")
      : source === "offline"
      ? this.getSVGIcon("lock")
      : this.getSVGIcon("sparkle");
    const titleText = isExpander
      ? "Text Expander"
      : source === "offline"
      ? "Offline Suggestion"
      : "AI Suggestion";

    let ttsEnabled = false;
    try {
      const settings = await new Promise((resolve) => {
        chrome.storage.sync.get(["enableTTS"], resolve);
      });

      if (settings.enableTTS !== false && suggestion.corrected) {
        ttsEnabled = true;
      }
    } catch (error) {
      console.error("Error getting TTS settings:", error);
    }

    const insightsHtml = this.generateInsightsHTML(insights);
    const sourceIndicator =
      source === "offline"
        ? `<span style="font-size: 11px; color: #9CA3AF; font-weight: 500;">Offline Mode</span>`
        : `<span style="font-size: 11px; color: #9CA3AF; font-weight: 500;">Powered by AI</span>`;

    const availableTones = window.aiEngine.getAvailableTones();
    const currentTone = window.aiEngine.getCurrentTone();

    const toneSelectorHtml =
      source !== "offline"
        ? `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 600;">Writing Style</div>
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          ${availableTones
            .map(
              (tone) => `
            <button class="refyne-tone-btn ${
              tone === currentTone ? "active" : ""
            }" 
                    data-tone="${tone}"
                    style="padding: 6px 10px; border: 2px solid ${
                      tone === currentTone ? "#6366F1" : "#E5E7EB"
                    }; 
                           background: ${
                             tone === currentTone ? "#6366F1" : "white"
                           }; 
                           color: ${
                             tone === currentTone ? "white" : "#6B7280"
                           }; 
                           border-radius: 6px; font-size: 10px; font-weight: 600; 
                           cursor: pointer; transition: all 0.2s ease;">
              ${window.aiEngine.getToneDisplayName(tone)}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `
        : "";

    const tooltipContent = `
        <!-- Header with Close Button -->
        <div style="background: linear-gradient(135deg, #F5F3FF, #EDE9FE); border-bottom: 2px solid #E0E7FF; padding: 2px 8px 2px 2px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; flex: 1;">
            <button class="refyne-tab-button active" data-tab="suggestion">
              <span style="margin-right: 4px; display: inline-flex; align-items: center;">${this.getSVGIcon(
                "sparkle"
              )}</span> Suggestion
            </button>
            <button class="refyne-tab-button" data-tab="insights">
              <span style="margin-right: 4px; display: inline-flex; align-items: center;">${this.getSVGIcon(
                "chart"
              )}</span> Insights
            </button>
          </div>
          <button class="refyne-close-btn" style="background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #6B7280;">
            ${this.getSVGIcon("close")}
          </button>
        </div>
        
        <!-- Suggestion Tab -->
        <div id="suggestion-tab" class="refyne-tab-content">
          <div class="refyne-suggestions-content" style="max-height: none; overflow-y: visible;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="background: ${titleBg}; padding: 8px 12px; border-radius: 6px; border: 1px solid ${
      source === "offline" ? "#FDE68A" : "#A7F3D0"
    }; display: flex; align-items: center; gap: 6px; flex: 1;">
                <span style="display: inline-flex; color: ${titleColor}; width: 14px; height: 14px;">${titleIcon}</span>
                <div style="font-weight: 700; color: ${titleColor}; font-size: 12px;">${titleText}</div>
              </div>
              ${
                ttsEnabled
                  ? `
              <button class="refyne-listen-btn" style="margin-left: 8px; padding: 6px 8px; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 4px; box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3); min-width: auto;">
                ${this.getSVGIcon("speaker")}
              </button>
              `
                  : ""
              }
            </div>
            
            ${toneSelectorHtml}
            
            <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
              <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Original</div>
              <div style="color: #6B7280; text-decoration: line-through; font-size: 12px; line-height: 1.4; word-wrap: break-word; max-height: 60px; overflow: hidden;">${
                suggestion.original
              }</div>
            </div>
            
            <div style="background: linear-gradient(135deg, #ECFDF5, #D1FAE5); border: 1px solid #10B981; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
              <div style="font-size: 10px; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Improved (${window.aiEngine.getToneDisplayName(
                suggestion.tone || "professional"
              )})</div>
              <div style="color: #065F46; font-weight: 600; font-size: 12px; line-height: 1.4; word-wrap: break-word; max-height: 80px; overflow: hidden;">${
                suggestion.corrected
              }</div>
            </div>
            
            <div style="text-align: center; padding: 8px; background: linear-gradient(135deg, #EEF2FF, #E0E7FF); border-radius: 6px; border: 1px dashed #C7D2FE; margin-bottom: 4px;">
              <div style="font-size: 11px; color: #4F46E5; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
                ${this.getSVGIcon("info")} Click to apply
              </div>
            </div>
          </div>
        </div>
        
        <!-- Insights Tab -->
        <div id="insights-tab" class="refyne-tab-content" style="display: none;">
          ${insightsHtml}
        </div>
        
        <!-- Footer -->
        <div style="padding: 8px 12px; border-top: 1px solid #F3F4F6; background: #FAFAFA; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${
              source === "offline" ? "#F59E0B" : "#10B981"
            };"></div>
            ${sourceIndicator}
          </div>
          <div style="font-size: 9px; color: #D1D5DB; font-weight: 600;">REFYNE</div>
        </div>
      `;

    this.tooltip.innerHTML = tooltipContent;

    this.tooltip.style.minWidth = "320px";
    this.tooltip.style.maxWidth = "380px";
    this.tooltip.style.maxHeight = "none";

    this.positionTooltip(targetElement);

    this.setupTabListeners(targetElement);
    this.setupListenButton(suggestion.corrected);
    this.setupCloseButton();

    if (window.aiEngine && source !== "offline") {
      this.setupToneButtons(targetElement, suggestion.original, (updatedSuggestion) => {
        activeSuggestion = updatedSuggestion; 
        applyCallback(updatedSuggestion);
      });
    }

    this.setupClickHandler(applyCallback);
    this.setupOutsideClickHandler();
  }

  setupToneButtons(targetElement, originalText, applyCallback) {
    const toneButtons = this.tooltip.querySelectorAll(".refyne-tone-btn");

    toneButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.stopPropagation();
        const improvedSection = this.tooltip.querySelector(
          "#suggestion-tab .refyne-suggestions-content > div:nth-last-child(2)"
        );
        if (!improvedSection) return;

        const originalImprovedContent = improvedSection.innerHTML;
        const originalTextContent =
          improvedSection.querySelector("div:last-child")?.textContent || "";

        improvedSection.innerHTML = this.createToneLoadingState(
          button.dataset.tone
        );

        try {
          const newSuggestion = await window.aiEngine.getSuggestions(
            originalText,
            button.dataset.tone
          );

          if (newSuggestion && newSuggestion.corrected) {
            this.smoothTransitionToNewTone(
              improvedSection,
              newSuggestion,
              button.dataset.tone
            );
            this.updateToneUIState(toneButtons, button);
            window.aiEngine.setCurrentTone(button.dataset.tone);
            this.setupClickHandler(() => {
              applyCallback(newSuggestion); 
            });
            this.setupListenButton(newSuggestion.corrected);
          } else {
            this.showToneErrorState(improvedSection, originalImprovedContent);
          }
        } catch (error) {
          console.error("Error generating tone suggestion:", error);
          this.showToneErrorState(improvedSection, originalImprovedContent);
        }
      });
    });
  }
  createToneLoadingState(tone) {
    const toneName = window.aiEngine.getToneDisplayName(tone);
    return `
      <div style="background: linear-gradient(135deg, #F0F9FF, #E0F2FE); border: 2px solid #BAE6FD; border-radius: 8px; padding: 16px; position: relative; overflow: hidden;">
        <!-- Animated background -->
        <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: shimmer 1.5s infinite;"></div>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
          <!-- Animated spinner -->
          <div style="width: 20px; height: 20px; border: 2px solid #E0F2FE; border-top: 2px solid #0EA5E9; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <div style="font-size: 11px; color: #0369A1; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Generating ${toneName} Version</div>
        </div>
        
        <!-- Loading text skeleton -->
        <div style="background: linear-gradient(90deg, #F0F9FF, #E0F2FE, #F0F9FF); background-size: 200% 100%; animation: shimmer 2s infinite; height: 12px; border-radius: 6px; margin-bottom: 6px;"></div>
        <div style="background: linear-gradient(90deg, #F0F9FF, #E0F2FE, #F0F9FF); background-size: 200% 100%; animation: shimmer 2s infinite 0.2s; height: 12px; border-radius: 6px; margin-bottom: 6px; width: 90%;"></div>
        <div style="background: linear-gradient(90deg, #F0F9FF, #E0F2FE, #F0F9FF); background-size: 200% 100%; animation: shimmer 2s infinite 0.4s; height: 12px; border-radius: 6px; width: 80%;"></div>
      </div>
    `;
  }

  smoothTransitionToNewTone(container, suggestion, tone) {
    container.style.opacity = "0";
    container.style.transition = "opacity 0.2s ease";

    setTimeout(() => {
      container.innerHTML = `
        <div style="background: linear-gradient(135deg, #ECFDF5, #D1FAE5); border: 2px solid #10B981; border-radius: 8px; padding: 14px; margin-bottom: 12px; animation: toneSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
          <div style="font-size: 11px; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-flex; animation: bounceIn 0.6s ease;">✨</span>
            Improved (${window.aiEngine.getToneDisplayName(tone)})
          </div>
          <div style="color: #065F46; font-weight: 600; font-size: 14px; line-height: 1.6; word-wrap: break-word; animation: fadeInUp 0.4s ease 0.1s both;">${
            suggestion.corrected
          }</div>
        </div>
      `;

      container.style.opacity = "1";
    }, 200);
  }

  updateToneUIState(toneButtons, activeButton) {
    toneButtons.forEach((btn) => {
      btn.style.transition = "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      btn.classList.remove("active");
      btn.style.background = "white";
      btn.style.color = "#6B7280";
      btn.style.borderColor = "#E5E7EB";
      btn.style.transform = "scale(1)";
    });

    activeButton.classList.add("active");
    activeButton.style.background = "#6366F1";
    activeButton.style.color = "white";
    activeButton.style.borderColor = "#6366F1";
    activeButton.style.transform = "scale(1.05)";
    setTimeout(() => {
      activeButton.style.transform = "scale(1)";
    }, 300);
  }

  showToneErrorState(container, fallbackContent) {
    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #FEF2F2, #FECACA); border: 2px solid #FCA5A5; border-radius: 8px; padding: 16px; text-align: center; animation: shake 0.5s ease;">
        <div style="color: #DC2626; font-size: 24px; margin-bottom: 8px;">⚠️</div>
        <div style="font-size: 12px; color: #991B1B; font-weight: 600; margin-bottom: 8px;">Failed to generate suggestion</div>
        <div style="font-size: 11px; color: #EF4444;">Please try again</div>
      </div>
    `;
    setTimeout(() => {
      container.innerHTML = fallbackContent;
    }, 2000);
  }

  setupCloseButton() {
    const closeBtn = this.tooltip.querySelector(".refyne-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.hide();
      });
    }
  }

  setupOutsideClickHandler() {
    const outsideClickListener = (e) => {
      if (
        !this.tooltip.contains(e.target) &&
        this.tooltip.style.display !== "none"
      ) {
        this.hide();
        document.removeEventListener("click", outsideClickListener);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", outsideClickListener);
    }, 100);
  }

  setupTabListeners(targetElement) {
    const tabButtons = this.tooltip.querySelectorAll(".refyne-tab-button");

    tabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const tabName = button.dataset.tab;

        tabButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        this.tooltip
          .querySelectorAll(".refyne-tab-content")
          .forEach((content) => {
            content.style.display = "none";
          });

        const activeTab = this.tooltip.querySelector(`#${tabName}-tab`);
        activeTab.style.display = "block";

        if (targetElement) {
          setTimeout(() => this.positionTooltip(targetElement), 10);
        }
      });
    });
  }

  setupListenButton(text) {
    if (!text) return;

    const listenBtn = this.tooltip.querySelector(".refyne-listen-btn");
    if (listenBtn) {
      const newListenBtn = listenBtn.cloneNode(true);
      listenBtn.parentNode.replaceChild(newListenBtn, listenBtn);

      newListenBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.speakText(text);
      });
    }
  }

  setupClickHandler(callback) {
    this.tooltip.onclick = null;

    this.tooltip.addEventListener("click", (e) => {
      if (
        !e.target.closest(".refyne-listen-btn") &&
        !e.target.classList.contains("refyne-tab-button") &&
        !e.target.closest(".refyne-tab-button") &&
        !e.target.classList.contains("refyne-tone-btn") &&
        !e.target.closest(".refyne-close-btn")
      ) {
        e.stopPropagation();
        callback();
        this.hide();
      }
    });
  }

  async speakText(text) {
    try {
      const settings = await new Promise((resolve) => {
        chrome.storage.sync.get(["enableTTS"], resolve);
      });

      if (settings.enableTTS === false) return;

      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("TTS error:", error);
    }
  }

  hide() {
    this.tooltip.style.display = "none";
    this.hideStatus();
  }

  contains(element) {
    return this.tooltip.contains(element);
  }

  showStatus(message, type = "info") {
    if (!this.statusDiv) {
      this.statusDiv = document.createElement("div");
      this.statusDiv.id = "refyne-status-message";
      Object.assign(this.statusDiv.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "14px 18px",
        borderRadius: "10px",
        zIndex: "2147483646",
        fontSize: "14px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        fontWeight: "600",
        maxWidth: "320px",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow:
          "0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
      });
      document.body.appendChild(this.statusDiv);
    }

    const colors = {
      info: {
        bg: "linear-gradient(135deg, #3B82F6, #2563EB)",
        text: "white",
        icon: this.getSVGIcon("info"),
      },
      success: {
        bg: "linear-gradient(135deg, #10B981, #059669)",
        text: "white",
        icon: this.getSVGIcon("check"),
      },
      error: {
        bg: "linear-gradient(135deg, #EF4444, #DC2626)",
        text: "white",
        icon: this.getSVGIcon("alert"),
      },
      warning: {
        bg: "linear-gradient(135deg, #F59E0B, #D97706)",
        text: "white",
        icon: this.getSVGIcon("warning"),
      },
    };

    const color = colors[type] || colors.info;
    this.statusDiv.style.background = color.bg;
    this.statusDiv.style.color = color.text;
    this.statusDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="display: inline-flex; align-items: center;">${color.icon}</span>
        <span>${message}</span>
      </div>
    `;
    this.statusDiv.style.display = "block";
    this.statusDiv.style.opacity = "1";
    this.statusDiv.style.transform = "translateX(0)";
    setTimeout(() => {
      this.hideStatus();
    }, 3000);
  }

  hideStatus() {
    if (this.statusDiv) {
      this.statusDiv.style.opacity = "0";
      this.statusDiv.style.transform = "translateX(400px)";
      setTimeout(() => {
        this.statusDiv.style.display = "none";
      }, 300);
    }
  }
}

window.TooltipManager = TooltipManager;
