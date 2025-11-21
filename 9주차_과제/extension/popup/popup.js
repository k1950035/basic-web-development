const gameArea = document.getElementById("game-area");
const animal = document.getElementById("animal");
const toggleBtn = document.getElementById("togglePet");
const xpDisplay = document.getElementById("xpDisplay");

// 랜덤 배경 불러오기 (Picsum)
const randomWidth = 300;
const randomHeight = 200;
gameArea.style.backgroundImage = `url('https://picsum.photos/${randomWidth}/${randomHeight}?random=${Date.now()}')`;

// XP 초기화
chrome.storage.local.get({ xp: 0 }, (data) => {
  xpDisplay.textContent = `XP: ${data.xp}`;
});

// 동물 클릭 시 간단 애니메이션
animal.addEventListener("click", () => {
  animal.style.transform = "translateX(-50%) scale(1.2)";
  setTimeout(() => (animal.style.transform = "translateX(-50%) scale(1)"), 300);

  // XP 증가
  chrome.storage.local.get({ xp: 0 }, (data) => {
    const newXp = data.xp + 1;
    chrome.storage.local.set({ xp: newXp }, () => {
      xpDisplay.textContent = `XP: ${newXp}`;
    });
  });
});

// 브라우저 위로 동물 띄우기
toggleBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "togglePet" });
});
