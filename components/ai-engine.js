class AIEngine {
    constructor() {
      this.rewriterInstance = null;
      this.summarizerInstance = null;
      this.isDownloading = false;
      this.downloadAttempted = false;
      this.offlineMode = false;
      this.offlineChecker = null;
      this.currentWritingStyle = "professional";
  
      this.writingStyleConfig = {
        professional: {
          name: "Professional",
          prompt:
            "Improve this text for professional communication, making it clear, concise, and business-appropriate while maintaining the original meaning.",
        },
        casual: {
          name: "Casual",
          prompt:
            "Make this text sound more casual, conversational, and friendly while keeping the original meaning.",
        },
        academic: {
          name: "Academic",
          prompt:
            "Make this text more formal, academic, and suitable for scholarly writing while preserving the original content.",
        },
        creative: {
          name: "Creative",
          prompt:
            "Make this text more creative, engaging, and expressive while maintaining the core message.",
        },
        concise: {
          name: "Concise",
          prompt:
            "Make this text more concise and to the point, removing unnecessary words while keeping the essential meaning.",
        },
        formal: {
          name: "Formal",
          prompt:
            "Make this text more formal and polished, suitable for official documents or formal communication.",
        },
      };
  
      this.initializeOfflineChecker();
    }
  
    initializeOfflineChecker() {
      this.offlineChecker = {
        rules: [
          {
            name: "subject_verb_agreement",
            pattern: /\b(He|She|It)\s+(have|do|are|were)\b/gi,
            replacement: (match, p1, p2) => {
              const corrections = {
                have: "has",
                do: "does",
                are: "is",
                were: "was",
              };
              return `${p1} ${corrections[p2.toLowerCase()] || p2}`;
            },
          },
          {
            name: "its_possessive",
            pattern: /\b(its)\s+(a|very|really|so)\b/gi,
            replacement: "it's $2",
          },
        ],
  
        dictionary: {
          recieve: "receive",
          seperate: "separate",
          definately: "definitely",
          occured: "occurred",
          alot: "a lot",
          untill: "until",
          wich: "which",
          teh: "the",
          adn: "and",
          thier: "their",
          tounge: "tongue",
          truely: "truly",
          wierd: "weird",
          neccessary: "necessary",
          pronounciation: "pronunciation",
        },
  
        checkText(text) {
          if (!text || text.trim().length < 3) return null;
  
          let corrected = text;
          let corrections = [];
          let hasCorrections = false;
  
          Object.keys(this.dictionary).forEach((misspelling) => {
            const regex = new RegExp(`\\b${misspelling}\\b`, "gi");
            if (regex.test(corrected)) {
              const fixed = this.dictionary[misspelling];
              corrected = corrected.replace(regex, fixed);
              corrections.push({
                original: misspelling,
                corrected: fixed,
                type: "spelling",
              });
              hasCorrections = true;
            }
          });
  
          this.rules.forEach((rule) => {
            let hasMatch = true;
            while (hasMatch) {
              hasMatch = false;
              const regex = new RegExp(rule.pattern.source, "gi");
              const match = regex.exec(corrected);
  
              if (match) {
                const original = match[0];
                const fixed =
                  typeof rule.replacement === "function"
                    ? rule.replacement(...match, match.index, corrected)
                    : original.replace(
                        new RegExp(rule.pattern.source, "gi"),
                        rule.replacement
                      );
  
                if (fixed !== original) {
                  corrected =
                    corrected.slice(0, match.index) +
                    fixed +
                    corrected.slice(match.index + original.length);
                  corrections.push({
                    original: original,
                    corrected: fixed,
                    type: "grammar",
                    rule: rule.name,
                  });
                  hasCorrections = true;
                  hasMatch = true;
                }
              }
            }
          });
  
          if (
            corrected.length > 0 &&
            corrected[0] !== corrected[0].toUpperCase()
          ) {
            corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
            hasCorrections = true;
          }
  
          if (!hasCorrections) return null;
  
          return {
            original: text,
            corrected: corrected,
            corrections: corrections,
            reason: "Offline grammar and spelling check",
            source: "offline",
          };
        },
      };
    }
  
    isChromeAIAvailable() {
      return "Rewriter" in self || "ai" in self;
    }
  
    async monitorDownloadProgress() {
      if (!this.isChromeAIAvailable()) return;
      if (this.downloadProgressInterval) {
        clearInterval(this.downloadProgressInterval);
      }
      try {
        this.downloadProgressInterval = setInterval(async () => {
          try {
            const availability = await Rewriter.availability();
  
            if (availability === "available") {
              console.log("Download completed!");
              this.isDownloading = false;
              this.offlineMode = false;
              clearInterval(this.downloadProgressInterval);
              this.downloadProgressInterval = null;
            } else if (availability === "downloading") {
              console.log("Download in progress...");
              clearInterval(this.downloadProgressInterval);
              this.downloadProgressInterval = null;
            }
          } catch (error) {
            console.error("Error checking availability:", error);
          }
        }, 2000);
  
        setTimeout(() => {
          if (this.downloadProgressInterval) {
            clearInterval(this.downloadProgressInterval);
            this.downloadProgressInterval = null;
          }
        }, 300000);
      } catch (error) {
        console.error("Download monitoring error:", error);
      }
    }
  
    async speakSuggestion(text) {
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
  
          utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
          };
  
          speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error("TTS error:", error);
      }
    }
  
    stopSpeaking() {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
    }
  
    async initialize() {
      if (!this.isChromeAIAvailable()) {
        console.log("AI APIs not available in this browser");
        this.offlineMode = true;
        return false;
      }
  
      try {
        if ("Rewriter" in self) {
          const availability = await Rewriter.availability();
          console.log("Rewriter availability:", availability);
  
          if (availability === "unavailable") {
            console.log("Rewriter API is unavailable");
            this.offlineMode = true;
          } else {
            if (availability === "downloadable" && !this.downloadAttempted) {
              console.log("AI model needs download - triggering...");
              this.isDownloading = true;
              this.downloadAttempted = true;
              this.monitorDownloadProgress();
            }
  
            console.log("Creating Rewriter instance...");
            this.rewriterInstance = await Rewriter.create({
              outputLanguage: "en",
              expectedInputLanguages: ["en"],
              expectedContextLanguages: ["en"],
            });
  
            console.log("Rewriter initialized successfully");
            const finalAvailability = await Rewriter.availability();
  
            if (finalAvailability === "available") {
              this.isDownloading = false;
              this.offlineMode = false;
            } else if (finalAvailability === "downloading") {
              this.isDownloading = true;
              this.offlineMode = true;
            }
          }
        }
        if ("ai" in self && self.ai.summarizer) {
          try {
            const summarizerAvailability = await self.ai.summarizer.capabilities();
            if (summarizerAvailability.available === "readily") {
              this.summarizerInstance = await self.ai.summarizer.create();
              console.log("Summarizer initialized successfully");
            }
          } catch (error) {
            console.log("Summarizer not available:", error);
          }
        }
  
        return true;
      } catch (error) {
        console.error("Failed to initialize AI:", error);
  
        if (
          error.message &&
          (error.message.includes("download") ||
            error.message.includes("Download"))
        ) {
          this.offlineMode = true;
          this.monitorDownloadProgress();
        } else {
          this.offlineMode = true;
        }
        return false;
      }
    }
  
    async getAISuggestions(text) {
      if (!this.rewriterInstance || this.isDownloading) return null;
  
      try {
        const availability = await Rewriter.availability();
        if (availability !== "available") return null;
  
        console.log(
          "Getting AI suggestions for text:",
          text.substring(0, 50) + "..."
        );
  
        const result = await this.rewriterInstance.rewrite(text, {
          context:
            "Improve this text for clarity, grammar, and professionalism while keeping the original meaning.",
        });
  
        if (!result || result.trim() === text.trim()) return null;
  
        return {
          original: text,
          corrected: result,
          reason: "AI-improved version",
          source: "ai",
        };
      } catch (err) {
        console.error("Rewriter API error:", err);
        return null;
      }
    }
  
    async summarizeText(text) {
      if (!text || text.length < 100) return null;
  
      if (this.summarizerInstance) {
        try {
          const summary = await this.summarizerInstance.summarize(text, {
            type: "key-points",
            format: "plain-text",
            length: "medium"
          });
          
          if (summary && summary.trim()) {
            return summary;
          }
        } catch (error) {
          console.error("Summarizer API error:", error);
        }
      }
  
      return null;
    }
  
    getOfflineSuggestions(text) {
      if (!this.offlineChecker) return null;
  
      try {
        return this.offlineChecker.checkText(text);
      } catch (error) {
        console.error("Offline checker error:", error);
        return null;
      }
    }
  
    async getSuggestions(text) {
      if (!text || text.trim().length < 3) return null;
  
      if (!this.offlineMode && !this.isDownloading) {
        const aiSuggestion = await this.getAISuggestions(text);
        if (aiSuggestion) return aiSuggestion;
      }
  
      return this.getOfflineSuggestions(text);
    }
  
    async getStatus() {
      if (!this.isChromeAIAvailable()) {
        return {
          status: "unavailable",
          message: "AI API Not Available",
          offline: true,
          mode: "offline",
        };
      }
  
      try {
        const availability = await Rewriter.availability();
  
        let message = "";
        let mode = "ai";
        switch (availability) {
          case "available":
            message = "AI Model Ready";
            mode = "ai";
            break;
          case "downloadable":
            message = "AI Model Needs Download";
            mode = "offline";
            break;
          case "downloading":
            message = "Downloading AI Model";
            mode = "offline";
            break;
          case "unavailable":
          default:
            message = "AI Model Unavailable";
            mode = "offline";
            break;
        }
  
        return {
          status: availability,
          message: message,
          offline: mode === "offline",
          mode: mode,
        };
      } catch (error) {
        return {
          status: "unavailable",
          message: "Error Checking Status",
          offline: true,
          mode: "offline",
        };
      }
    }
  
    isOfflineMode() {
      return this.offlineMode;
    }
  
    isAIAvailable() {
      return (
        !this.offlineMode && !this.isDownloading && this.rewriterInstance !== null
      );
    }
  }
  
  window.AIEngine = AIEngine;