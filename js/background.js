
class AIAssistant {
  constructor() {
    this.apiKey = "";
    this.apiUrl = "https://api.deepseek.com/chat/completions";
    this.loadApiKey();
  }

  async loadApiKey() {
    const data = await chrome.storage.local.get(["apiKey"]);
    this.apiKey = data.apiKey;
  }

  async saveApiKey(apiKey) {
    await chrome.storage.local.set({ apiKey });
    this.apiKey = apiKey;
  }
 async create() {
  const inatance = new AIAssistant();
  const data = await chrome.storage.local.get(["apiKey"]);
  inatance.apiKey = data.apiKey;
  return inatance;
 }

 
 async askAI(question, context = "") {
    if (!this.apiKey)
      throw new Error(
        "API ключ не установлен. Укажите его в настройках расширения."
      );

    const fullQuestion = context
      ? `Котекст: ${context}\n\nВопрос: ${question}`
      : question;

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "Ты полезный ассистент. Отвечай на русском языке.",
            },
            { role: "user", content: fullQuestion },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error asking AI:", error);
      return "Error: Unable to get a response from the AI.";
    }
  }

  async analyzePageText(text, userQuestion = "Проанализируй этот текст: ") {
    if (text.length > 15000) {
      text = text.substring(0, 15000) + "...[текст обрезан]";

      const prompt = `${userQuestion} \n\nТекст страницы:\n${text}`;
      try {
        const response = await this.askAI(prompt);
        return response;
      } catch (error) {
        console.error("Error analyzing page text:", error);
        return "Error: Unable to analyze the page text.";
      }
    }
  }
}

const aiAssistant = new AIAssistant().create();

//background service

isProcessing = false;

//handler messages from content script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeText") {
    if (isProcessing) {
      sendResponse({ error: "Один запрос уже обрабатывается" });
      return true;
    }

    isProcessing = true;
    aiAssistant
      .analyzePageText(
        request.text,
        request.question || "Выбери правильный вариант ответа"
      )
      .then((res) => {
        isProcessing = false;
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "aiResponse",
          result: res,
        });

        sendResponse({ success: true });
      })
      .catch((error) => {
        isProcessing = false;
        console.error("Error ai response", error);

        sendResponse({ error: error.message });
      });

    if (request.action === "setApiKey") {
      aiAssistant
        .saveApiKey(request.apiKey)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ erorr: error.message });
        });

      return true;
    }

    if (request.action === "getStatus") {
      chrome.storage.local.get(["apiKey"], (data) => {
        sendResponse({
          hasApiKey: !!data.apiKey,
          isProcessing,
        });
      });
    }
    return true;
  }
});
