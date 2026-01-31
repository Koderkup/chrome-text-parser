import { storage } from "./js/storage";
export class AIAssistant {
  constructor() {
    this.apiKey = storage.AI_API_KEY;
    this.apiUrl = "https://api.deepseek.com/chat/completions";
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
