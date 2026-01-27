let isWaiting = false;

document.addEventListener("dblclick", () => {
  if (isWaiting) {
   return;
  }
 isWaiting=true;
 let pageText = document.body.innerText || document.body.textContent;

 
 
    setTimeout(() => {
      isWaiting = false;
    }, 1000);
});
