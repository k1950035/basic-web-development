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
let startTime = Date.now();
let inputListenerActive = true;

const quoteElement = document.getElementById("quote");
const messageElement = document.getElementById("message");
const typedValueElement = document.getElementById("typed-value");
const startButton = document.getElementById("start");

function handleTyping() {
  if (!inputListenerActive) return;

  const currentWord = words[wordIndex];
  const typedValue = typedValueElement.value;

  if (typedValue === currentWord && wordIndex === words.length - 1) {
    const elapsedTime = new Date().getTime() - startTime;
    const message = `Congratulations! You finished in ${
      elapsedTime / 1000
    } seconds.`;
    messageElement.innerText = message;
    quoteElement.style.display = "none";
    typedValueElement.disabled = true;
    inputListenerActive = false;
  } else if (typedValue.endsWith(" ") && typedValue.trim() === currentWord) {
    typedValueElement.value = "";
    wordIndex++;
    for (const wordElement of quoteElement.childNodes) {
      wordElement.className = "";
    }
    quoteElement.childNodes[wordIndex].className = "highlight";
  } else if (currentWord.startsWith(typedValue)) {
    typedValueElement.className = "";
  } else {
    typedValueElement.className = "error";
  }
}

typedValueElement.addEventListener("input", handleTyping);

startButton.addEventListener("click", () => {
  const quoteIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[quoteIndex];
  words = quote.split(" ");
  wordIndex = 0;

  const spanWords = words.map(function (word) {
    return `<span>${word} </span>`;
  });
  quoteElement.innerHTML = spanWords.join("");
  quoteElement.childNodes[0].className = "highlight";

  messageElement.innerText = "";
  quoteElement.style.display = "block";

  typedValueElement.value = "";
  typedValueElement.disabled = false;
  typedValueElement.focus();

  startTime = new Date().getTime();
  inputListenerActive = true;
});
