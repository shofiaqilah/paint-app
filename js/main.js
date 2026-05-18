// main.js
import { getBresenhamPoints } from "./algoritma/brensenham_line.js";
import { getMidpointCircle } from "./algoritma/brensenham_circle.js";

// Inisiasi Canvas
const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

// Elemen UI Baru
const colorPicker = document.getElementById("colorPicker");
const shapeSelect = document.getElementById("shapeSelect");
const lineTypeSelect = document.getElementById("lineTypeSelect");
const lineWidthInput = document.getElementById("lineWidthInput");
const fillSelect = document.getElementById("fillSelect");

let startX, startY;

function drawPixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  startX = Math.floor(e.clientX - rect.left);
  startY = Math.floor(e.clientY - rect.top);
});

canvas.addEventListener("mouseup", (e) => {
  const rect = canvas.getBoundingClientRect();
  const endX = Math.floor(e.clientX - rect.left);
  const endY = Math.floor(e.clientY - rect.top);

  const color = colorPicker.value;
  const shape = shapeSelect.value;

  const lineType = lineTypeSelect.value;
  const lineWidth = parseInt(lineWidthInput.value);

  switch (shape) {
    case "line_bresenham":
      const points = getBresenhamPoints(startX, startY, endX, endY);
      points.forEach((p) => drawPixel(p.x, p.y, color));
      break;

    case "circle_midpoint":
      const radius = Math.floor(
        Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2),
      );
      const circlePoints = getMidpointCircle(startX, startY, radius);
      circlePoints.forEach((p) => drawPixel(p.x, p.y, color));
      break;
    
  }
});

// Button hapus
document.getElementById("clearBtn").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("applyFillBtn").addEventListener("click", () => {
  const fillMethod = fillSelect.value;
  console.log("Menjalankan algoritma fill:", fillMethod);
  // Panggil fungsi fill
});
