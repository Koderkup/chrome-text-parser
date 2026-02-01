// class AIAssistant {
//   constructor() {
//     this.apiKey = "";
//     this.apiUrl =
//       "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
//     // this.apiUrl = "https://api.deepseek.com/chat/completions";
//   }

//   async loadApiKey() {
//     const data = await chrome.storage.local.get(["apiKey"]);
//     this.apiKey = data.apiKey || "";
//     console.log("Loaded API key:", this.apiKey ? "present" : "missing");
//   }

//   async saveApiKey(apiKey) {
//     await chrome.storage.local.set({ apiKey });
//     this.apiKey = apiKey;
//     console.log("Saved API key");
//   }

//   async askAI(question, context = "") {
//     console.log("Asking AI, API key:", this.apiKey ? "present" : "missing");

//     if (!this.apiKey) {
//       console.error("No API key!");
//       throw new Error(
//         "API ключ не установлен. Укажите его в настройках расширения."
//       );
//     }

//     const fullQuestion = context
//       ? `Контекст: ${context}\n\nВопрос: ${question}`
//       : question;

//     console.log("Sending request to DeepSeek...");

//     try {
//       const response = await fetch(this.apiUrl, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${this.apiKey}`,
//         },
//         body: JSON.stringify({
//           model: "deepseek-chat",
//           messages: [
//             {
//               role: "system",
//               content: "Ты полезный ассистент. Отвечай на русском языке.",
//             },
//             { role: "user", content: fullQuestion },
//           ],
//           max_tokens: 1024,
//           temperature: 0.7,
//         }),
//       });

//       console.log("Response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("API error:", errorText);
//         throw new Error(`API error ${response.status}: ${response.statusText}`);
//       }

//       const data = await response.json();
//       console.log("API response received");

//       if (!data.choices || !data.choices[0] || !data.choices[0].message) {
//         throw new Error("Invalid API response format");
//       }

//       return data.choices[0].message.content;
//     } catch (error) {
//       console.error("Error asking AI:", error);
//       throw new Error("Не удалось получить ответ от AI: " + error.message);
//     }
//   }

//   async analyzePageText(text, userQuestion = "Проанализируй этот текст") {
//     console.log("Analyzing text, length:", text.length);

//     // Обрезаем текст если слишком длинный
//     if (text.length > 15000) {
//       text = text.substring(0, 15000) + "...[текст обрезан]";
//       console.log("Text trimmed to 15000 chars");
//     }

//     const prompt = `${userQuestion}\n\nТекст страницы:\n${text}`;
//     return await this.askAI(prompt);
//   }
// }
class AIAssistant {
  constructor() {
    this.apiKey = "";
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
  }

  async loadApiKey() {
    const data = await chrome.storage.local.get(["apiKey"]);
    this.apiKey = data.apiKey || "";
    console.log("Loaded Gemini API key:", this.apiKey ? "present" : "missing");
  }

  async saveApiKey(apiKey) {
    await chrome.storage.local.set({ apiKey });
    this.apiKey = apiKey;
    console.log("Saved Gemini API key");
  }

  async askAI(question, context = "") {
    console.log("Asking Gemini, API key:", this.apiKey ? "present" : "missing");

    if (!this.apiKey) {
      console.error("No Gemini API key!");
      throw new Error(
        "API ключ Gemini не установлен. Укажите его в настройках расширения."
      );
    }

    const fullQuestion = context
      ? `Контекст: ${context}\n\nВопрос: ${question}`
      : question;

    console.log("Sending request to Gemini...");

    try {
      // Правильный URL для Gemini
      const url = `${this.apiUrl}?key=${this.apiKey}`;
      console.log("Request URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullQuestion,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 40,
          },
        }),
      });

      console.log("Gemini response status:", response.status);
      const responseText = await response.text();
      console.log(
        "Gemini response text (first 500 chars):",
        responseText.substring(0, 500)
      );

      if (!response.ok) {
        console.error("Gemini API error full:", responseText);

        let errorMessage = `Gemini API error ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          // Если не JSON, используем текст как есть
          errorMessage = responseText.substring(0, 200);
        }

        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      console.log("Gemini API parsed response:", data);

      // Проверяем структуру ответа Gemini
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0]
      ) {
        console.error("Invalid Gemini response format:", data);

        // Альтернативный путь для структуры ответа
        if (data.choices && data.choices[0] && data.choices[0].message) {
          console.log("Using alternative response format");
          return data.choices[0].message.content;
        }

        throw new Error("Неверный формат ответа Gemini");
      }

      const result = data.candidates[0].content.parts[0].text;
      console.log("Gemini response text length:", result.length);

      return result;
    } catch (error) {
      console.error("Error asking Gemini:", error);
      throw new Error("Не удалось получить ответ от Gemini: " + error.message);
    }
  }

  async analyzePageText(text, userQuestion = "Проанализируй этот текст") {
    console.log("Analyzing text with Gemini, length:", text.length);

    // Обрезаем текст если слишком длинный (Gemini имеет ограничения)
    if (text.length > 20000) {
      text = text.substring(0, 20000) + "...[текст обрезан]";
      console.log("Text trimmed to 20000 chars for Gemini");
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
  console.log("Background received action:", request.action);

  // Обработка setApiKey
  if (request.action === "setApiKey") {
    console.log("Setting Gemini API key...");
    aiAssistant
      .saveApiKey(request.apiKey)
      .then(() => {
        sendResponse({
          success: true,
          message: "Gemini API ключ сохранен",
        });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true;
  }

  // Обработка getStatus
  if (request.action === "getStatus") {
    console.log("Getting status...");
    chrome.storage.local.get(["apiKey"], (data) => {
      sendResponse({
        hasApiKey: !!data.apiKey,
        isProcessing,
        provider: "Google Gemini",
      });
    });
    return true;
  }

  // Обработка analyzeText
  if (request.action === "analyzeText") {
    console.log("Analyzing text request with Gemini...");

    if (isProcessing) {
      sendResponse({ error: "Один запрос уже обрабатывается" });
      return true;
    }

    isProcessing = true;
    console.log("Text length to analyze:", request.text.length);

    // Ограничим текст для Gemini (чтобы не превысить лимиты)
    const textToAnalyze =
      request.text.length > 15000
        ? request.text.substring(0, 15000) + "...[текст обрезан]"
        : request.text;

    aiAssistant
      .analyzePageText(
        textToAnalyze,
        request.question || "Проанализируй этот текст кратко"
      )
      .then((res) => {
        console.log("Gemini response received, length:", res.length);
        isProcessing = false;

        // Отправляем ответ обратно на вкладку
        if (sender.tab && sender.tab.id) {
          chrome.tabs
            .sendMessage(sender.tab.id, {
              action: "aiResponse",
              result: res,
              provider: "Google Gemini",
            })
            .catch((err) => {
              console.error("Error sending response to tab:", err);
            });
        }

        sendResponse({
          success: true,
          result: res,
          provider: "Google Gemini",
        });
      })
      .catch((error) => {
        console.error("Error in analyzePageText:", error);
        isProcessing = false;
        sendResponse({ error: error.message });
      });

    return true;
  }

  return false;
});

// Инициализация
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});
