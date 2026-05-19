// main.js
import { getBresenhamPoints } from "./algorithms/bresenham_line.js";
import { getMidpointCircle } from "./algorithms/bresenham_circle.js";

// Inisiasi Canvas
import { canvas, ctx } from "./utils/canvas.js";

// Elemen UI Baru
const colorPicker = document.getElementById("colorPicker");
// const shapeSelect = document.getElementById("shapeSelect");
const lineTypeSelect = document.getElementById("lineTypeSelect");
const lineWidthInput = document.getElementById("lineWidthInput");
const fillSelect = document.getElementById("fillSelect");

let currentShape = "bresenham_line";
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
  const shape = currentShape;

  const lineType = lineTypeSelect.value;
  const lineWidth = parseInt(lineWidthInput.value);

  // event button untuk pilih bentuk
  const shapeButtons = document.querySelectorAll(".shape-btn");

  shapeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      shapeButtons.forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");

      currentShape = btn.dataset.shape;
    });
  });

  switch (shape) {
    case "bresenham_line":
      const points = getBresenhamPoints(startX, startY, endX, endY);
      points.forEach((p) => drawPixel(p.x, p.y, color));
      break;

    case "bresenham_circle":
      const radius = Math.floor(
        Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2),
      );
      const circlePoints = getMidpointCircle(startX, startY, radius);
      circlePoints.forEach((p) => drawPixel(p.x, p.y, color));
      break;

    case "elips":
      break;

    case "rectangle":
      break;

    case "square":
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
