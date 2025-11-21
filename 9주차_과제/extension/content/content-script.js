let petDiv;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "showPet") {
    if (!petDiv) {
      petDiv = document.createElement("div");
      petDiv.id = "floatingPet";
      petDiv.style.position = "fixed";
      petDiv.style.bottom = "10px";
      petDiv.style.right = "10px";
      petDiv.style.width = "50px";
      petDiv.style.height = "50px";
      petDiv.style.backgroundImage =
        "url(chrome-extension://__EXTENSION_ID__/assets/animal.png)";
      petDiv.style.backgroundSize = "cover";
      petDiv.style.zIndex = 9999;
      petDiv.style.cursor = "pointer";
      document.body.appendChild(petDiv);

      // 드래그 가능하게
      petDiv.onmousedown = function (e) {
        let shiftX = e.clientX - petDiv.getBoundingClientRect().left;
        let shiftY = e.clientY - petDiv.getBoundingClientRect().top;

        function moveAt(pageX, pageY) {
          petDiv.style.left = pageX - shiftX + "px";
          petDiv.style.top = pageY - shiftY + "px";
        }

        function onMouseMove(e) {
          moveAt(e.pageX, e.pageY);
        }

        document.addEventListener("mousemove", onMouseMove);

        petDiv.onmouseup = function () {
          document.removeEventListener("mousemove", onMouseMove);
          petDiv.onmouseup = null;
        };
      };
      petDiv.ondragstart = () => false;
    }
  } else if (msg.action === "hidePet") {
    if (petDiv) {
      petDiv.remove();
      petDiv = null;
    }
  }
});
