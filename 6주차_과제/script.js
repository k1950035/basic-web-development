let zIndex = 10;
let plantDrag = null;

const plants = document.querySelectorAll(".plant");
const terrarium = document.getElementById("terrarium");

plants.forEach(plant => {
    plant.addEventListener("dragstart", (e) => {
        plantDrag = e.target;
        e.dataTransfer.setData("text/plain", e.target.id);
    });

    plant.addEventListener("dblclick", () => {
        zIndex++;
        plant.style.zIndex = zIndex;
    });
});

terrarium.addEventListener("dragover", (e) => {
    e.preventDefault();
});

terrarium.addEventListener("drop", (e) => {
    e.preventDefault();

    const plantId = e.dataTransfer.getData("text/plain");
    const plant = document.getElementById(plantId);

    terrarium.appendChild(plant);

    const rect = terrarium.getBoundingClientRect();
    plant.style.position = "absolute";
    plant.style.left = (e.clientX - rect.left - plant.width / 2) + "px";
    plant.style.top = (e.clientY - rect.top - plant.height / 2) + "px";

    zIndex++;
    plant.style.zIndex = zIndex;
});
