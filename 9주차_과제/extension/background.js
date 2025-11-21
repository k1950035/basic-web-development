let petVisible = false;
let lastActiveTabTime = Date.now();

// 메시지 처리: 동물 꺼내기 / 집으로 넣기
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "togglePet") {
    petVisible = !petVisible;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;

      // 메시지 보내기
      chrome.tabs.sendMessage(
        tabId,
        { action: petVisible ? "showPet" : "hidePet" },
        (response) => {
          if (chrome.runtime.lastError) {
            // content script가 없으면 동적 주입 후 다시 메시지
            chrome.scripting.executeScript(
              {
                target: { tabId: tabId },
                files: ["content/content-script.js"],
              },
              () => {
                chrome.tabs.sendMessage(tabId, {
                  action: petVisible ? "showPet" : "hidePet",
                });
              }
            );
          }
        }
      );
    });
  }
});

// 브라우저 사용 시간 기록 (간단한 코인 적립)
setInterval(() => {
  chrome.storage.local.get({ coins: 0 }, (data) => {
    const now = Date.now();
    const diffMinutes = Math.floor((now - lastActiveTabTime) / 60000);
    lastActiveTabTime = now;

    const newCoins = data.coins + diffMinutes; // 1분당 1코인
    chrome.storage.local.set({ coins: newCoins });
  });
}, 60000);
