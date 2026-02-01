let isWaiting = false;
function isChromeAPIAvailable() {
  try {
    return (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.id !== undefined
    );
  } catch (e) {
    return false;
  }
}
document.addEventListener("dblclick", (e) => {
  if (isWaiting) {
    return;
  }
  isWaiting = true;

  if (!isChromeAPIAvailable()) {
    alert(
      "❌ Расширение не доступно. Обновите страницу (F5) или перезагрузите расширение."
    );
    return;
  }
  let pageText = document.body.innerText || document.body.textContent;
  console.log("Page text length:", pageText.length);

const previewText = pageText.substring(0, 1500);
alert(
  `Текст для отправки в AI (первые 1500 символов):\n\n${previewText}${
    pageText.length > 500 ? "..." : ""
  }\n\nВсего символов: ${pageText.length}`
);

  //send message to background script
  chrome.runtime.sendMessage(
    {
      action: "analyzeText",
      text: pageText.substring(0, 5000), // Ограничим для теста
      question: "Проанализируй этот текст кратко",
    },
    (response) => {
      console.log("Response from background:", response);
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError);
        showError("Ошибка связи: " + chrome.runtime.lastError.message);
      } else if (response && response.error) {
        showError(response.error);
      }
    }
  );

  setTimeout(() => {
    isWaiting = false;
  }, 10000);
});

//receive answer from AI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "aiResponse") {
    console.log("Received AI response");
    showAIResult(request.result);
  }
  return false;
});

function showAIResult(result) {
  console.log("Showing AI result:", result.substring(0, 100) + "...");

  const resultDiv = document.createElement("div");
  resultDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    color: #28344F;
    padding: 20px;
    border-radius: 10px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    border: 2px solid #28344F;
    box-shadow: 0 5px 30px rgba(0,0,0,0.3);
    max-width: 80%;
    max-height: 80vh;
    overflow: auto;
  `;

  // Экранируем HTML для безопасности
  const safeResult = result
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  resultDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0; color: #28344F;">🤖 AI Анализ</h3>
      <button id="close-ai-popup" style="
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    </div>
    <div style="
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 15px;
      font-size: 14px;
      line-height: 1.5;
      max-height: 300px;
      overflow-y: auto;
    ">
      ${safeResult}
    </div>
    <button id="copy-result" style="
      background: #28344F;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">Копировать текст</button>
  `;

  document.body.appendChild(resultDiv);

  // Обработчики
  document.getElementById("close-ai-popup").addEventListener("click", () => {
    resultDiv.remove();
  });

  document.getElementById("copy-result").addEventListener("click", () => {
    navigator.clipboard
      .writeText(result)
      .then(() => {
        const btn = document.getElementById("copy-result");
        const originalText = btn.textContent;
        btn.textContent = "Скопировано!";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error("Copy error:", err);
        alert("Не удалось скопировать текст");
      });
  });

  // Закрытие по клику вне
  resultDiv.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", (e) => {
    if (!resultDiv.contains(e.target)) {
      resultDiv.remove();
    }
  });
}

function showError(error) {
  console.error("Showing error:", error);

  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;
  errorDiv.textContent = `Ошибка: ${error}`;
  document.body.appendChild(errorDiv);

  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}
