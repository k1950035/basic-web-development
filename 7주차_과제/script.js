const quotes = [
  "Actions speak louder than words.",
  "The early bird catches the worm.",
  "A journey of a thousand miles begins with a single step.",
  "Don't count your chickens before they hatch.",
  "When in Rome, do as the Romans do.",
  "Practice makes perfect.",
  "Honesty is the best policy.",
  "You reap what you sow.",
];

let words = [];
let wordIndex = 0;
let startTime;
let bestScore = localStorage.getItem("bestScore") || null;

const quoteElement = document.getElementById("quote");
const messageElement = document.getElementById("message");
const typedValueElement = document.getElementById("typed-value");
const startButton = document.getElementById("start");

const modal = document.getElementById("result-modal");
const resultTime = document.getElementById("result-time");
const bestTime = document.getElementById("best-time");
const closeModal = document.getElementById("close-modal");

function openModal(time) {
  resultTime.innerText = `이번 기록: ${time} 초`;

  if (bestScore === null || time < bestScore) {
    bestScore = time;
    localStorage.setItem("bestScore", bestScore);
  }

  bestTime.innerText = `최고 기록: ${bestScore} 초`;
  modal.style.display = "flex";
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

typedValueElement.addEventListener("input", () => {
  const currentWord = words[wordIndex];
  const typedValue = typedValueElement.value;

  if (typedValue === currentWord && wordIndex === words.length - 1) {
    const elapsedTime = (new Date().getTime() - startTime) / 1000;
    openModal(elapsedTime.toFixed(2));
    typedValueElement.disabled = true;
    return;
  }

  if (typedValue.endsWith(" ") && typedValue.trim() === currentWord) {
    typedValueElement.value = "";
    wordIndex++;
    for (const wordElement of quoteElement.childNodes) {
      wordElement.className = "";
    }
    quoteElement.childNodes[wordIndex].className = "highlight";
  }

  if (currentWord.startsWith(typedValue)) {
    typedValueElement.classList.remove("error");
    typedValueElement.classList.add("correct");
  } else {
    typedValueElement.classList.remove("correct");
    typedValueElement.classList.add("error");
  }
});

startButton.addEventListener("click", () => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  words = quote.split(" ");
  wordIndex = 0;
  quoteElement.innerHTML = words.map(w => `<span>${w} </span>`).join("");
  quoteElement.childNodes[0].className = "highlight";

  typedValueElement.value = "";
  typedValueElement.disabled = false;
  typedValueElement.className = "";
  typedValueElement.focus();

  messageElement.innerText = "";
  startTime = new Date().getTime();
});