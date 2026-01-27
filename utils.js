async function askAI(question) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer YOUR_API_KEY",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: question }],
      max_tokens: 1024,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Использование
askAI("Привет! Как дела?").then((answer) => console.log(answer));
