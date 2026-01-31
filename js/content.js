let isWaiting = false;

document.addEventListener("dblclick", (e) => {
  if (isWaiting) {
    return;
  }
  isWaiting = true;
  let pageText = document.body.innerText || document.body.textContent;

  //send message to background script

  chrome.runtime.sendMessage(
    {
      action: "analyzeText",
      text: pageText,
      question: "Выбери правильный вариант ответа",
    },
    (response) => {
      if (response && response.error) {
        showError(response.error);
      }
    }
  );

  setTimeout(() => {
    isWaiting = false;
  }, 3000);
});

//receive answer from AI

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "aiResponse") {
    showAIResult(request.result);
  }
});

function showAIResult(result) {
  const resultDiv = document.createElement("div");
  resultDiv.style.textCss = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  resultDiv.textContent = result;
  document.body.appendChild(resultDiv);

  setTimeout(() => {
    resultDiv.remove();
  }, 9000);
}

function showError(error) {
  const errorDiv = document.createElement("div");
  errorDiv.textContent = error;
  errorDiv.style.textCss = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
`;
  errorDiv.textContent = error;
  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}
