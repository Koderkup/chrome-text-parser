class AIAssistant {
  constructor() {
    this.apiKey = "";
    this.apiUrl = "https://api.deepseek.com/chat/completions";
  }

  async loadApiKey() {
    const data = await chrome.storage.local.get(["apiKey"]);
    this.apiKey = data.apiKey || "";
  }

  async saveApiKey(apiKey) {
    await chrome.storage.local.set({ apiKey });
    this.apiKey = apiKey;
  }

  async askAI(question, context = "") {
    if (!this.apiKey) {
      throw new Error(
        "API ключ не установлен. Укажите его в настройках расширения."
      );
    }

    const fullQuestion = context
      ? `Контекст: ${context}\n\nВопрос: ${question}`
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
      throw new Error("Не удалось получить ответ от AI.");
    }
  }

  async analyzePageText(text, userQuestion = "Проанализируй этот текст") {
    // Обрезаем текст если слишком длинный
    if (text.length > 15000) {
      text = text.substring(0, 15000) + "...[текст обрезан]";
    }

    const prompt = `${userQuestion}\n\nТекст страницы:\n${text}`;
    return await this.askAI(prompt);
  }
}

// Создаем экземпляр
const aiAssistant = new AIAssistant();

// Загружаем API ключ при инициализации
aiAssistant.loadApiKey();

// Флаг обработки
let isProcessing = false;

// Обработчик сообщений
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // Обработка setApiKey
  if (request.action === "setApiKey") {
    aiAssistant
      .saveApiKey(request.apiKey)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true;
  }

  // Обработка getStatus
  if (request.action === "getStatus") {
    chrome.storage.local.get(["apiKey"], (data) => {
      sendResponse({
        hasApiKey: !!data.apiKey,
        isProcessing,
      });
    });
    return true;
  }

  // Обработка analyzeText
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

        // Отправляем ответ обратно на вкладку
        if (sender.tab && sender.tab.id) {
          chrome.tabs
            .sendMessage(sender.tab.id, {
              action: "aiResponse",
              result: res,
            })
            .catch((err) => {
              console.error("Error sending response to tab:", err);
            });
        }

        sendResponse({ success: true, result: res });
      })
      .catch((error) => {
        isProcessing = false;
        console.error("Error analyzing text:", error);
        sendResponse({ error: error.message });
      });

    return true; // Важно для асинхронного ответа
  }

  // Для неизвестных действий
  return false;
});

// Обработка ошибок
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "error") {
    console.error("Error from content script:", message.error);
  }
  return false;
});

// Инициализация
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});
