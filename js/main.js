import { getBresenhamPoints } from "./algorithms/bresenham_line.js";
import { getDdaPoints, applyLineStyle } from "./algorithms/dda_line.js";
import { getMidpointCircle } from "./algorithms/midpoint_circle.js";
import { getMidpointEllipse } from "./algorithms/midpoint_ellipse.js";
import { getSquarePoints, getRectanglePoints, getTrianglePoints } from "./shapes/shapes.js";
import { scanLineFill } from "./algorithms/warna/scanline.js";
import { floodFill } from "./algorithms/warna/floodfill.js";
import { boundaryFill } from "./algorithms/warna/boundaryfill.js";
import {
  hexToRgba,
  rgbaToCss,
} from "./algorithms/warna/helper.js";
import { canvas, ctx, clearCanvas } from "./utils/canvas.js";

const colorPicker = document.getElementById("colorPicker");
const lineTypeSelect = document.getElementById("lineTypeSelect");
const lineStyleSelect = document.getElementById("lineStyleSelect");
const triangleTypeSelect = document.getElementById("triangleTypeSelect");
const lineWidthInput = document.getElementById("lineWidthInput");
const fillSelect = document.getElementById("fillSelect");
const applyFillBtn = document.getElementById("applyFillBtn");
const shapeButtons = document.querySelectorAll(".shape-btn");

let currentShape = "bresenham_line";
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let isDrawing = false;
let previewSnapshot = null;
let previewFrameId = null;
let lastShapeBounds = null;
let lastStrokeColor = colorPicker.value;

ctx.imageSmoothingEnabled = false;

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(event.clientX - rect.left),
    y: Math.floor(event.clientY - rect.top),
  };
}

function shouldPreviewShape(shape) {
  return (
    shape === "bresenham_line" ||
    shape === "midpoint_circle" ||
    shape === "elips" ||
    shape === "square" ||
    shape === "rectangle" ||
    shape === "triangle"
  );
}

function setActiveShape(shape) {
  currentShape = shape;

  // Tampilkan/sembunyikan dropdown tipe segitiga
  const trianglePanel = document.getElementById("triangleTypePanel");
  if (trianglePanel) {
    trianglePanel.style.display = shape === "triangle" ? "inline-flex" : "none";
  }

  // Tampilkan/sembunyikan dropdown algoritma garis (hanya untuk garis)
  const lineTypePanel = document.getElementById("lineTypePanel");
  if (lineTypePanel) {
    lineTypePanel.style.display = shape === "bresenham_line" ? "inline-flex" : "none";
  }

  shapeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.shape === shape);
  });

  // Update footer
  const footer = document.querySelector(".footer");
  if (footer) {
    const labels = {
      bresenham_line: `Garis (${lineTypeSelect.value})`,
      midpoint_circle: "Lingkaran",
      elips: "Elips",
      square: "Persegi",
      rectangle: "Persegi Panjang",
      triangle: "Segitiga",
    };
    footer.textContent = `Tool aktif : ${labels[shape] || shape}`;
  }
}

function plotPixel(x, y, color, size = 1) {
  const pixelSize = Math.max(1, Number.parseInt(size, 10) || 1);
  const offset = Math.floor(pixelSize / 2);

  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(x) - offset,
    Math.round(y) - offset,
    pixelSize,
    pixelSize,
  );
}

function drawPoints(points, color, size = 1) {
  const seen = new Set();
  const roundedSize = Math.max(1, Number.parseInt(size, 10) || 1);

  ctx.fillStyle = color;
  for (const point of points) {
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    const key = `${x}:${y}`;

    if (seen.has(key)) continue;
    seen.add(key);
    plotPixel(x, y, color, roundedSize);
  }
}

function boundsFromPoints(points) {
  if (points.length === 0) {
    return null;
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  return { minX, maxX, minY, maxY };
}

function renderShape(
  startPointX,
  startPointY,
  endPointX,
  endPointY,
  color,
  preview = false,
) {
  const lineWidth = Number.parseInt(lineWidthInput.value, 10) || 1;
  const strokeColor = preview
    ? rgbaToCss({ ...hexToRgba(color), a: 90 })
    : color;

  // Ambil tipe garis (hanya berlaku untuk shape berbasis garis)
  const rawStyle = lineStyleSelect ? lineStyleSelect.value.toLowerCase() : "solid";
  // Normalisasi: "dashed-dotted" dari value HTML
  const lineStyle = rawStyle.replace(" ", "-"); // "dashed dotted" → "dashed-dotted"

  let points = [];

  switch (currentShape) {
    case "bresenham_line": {
      const rawPoints =
        lineTypeSelect.value === "DDA"
          ? getDdaPoints(startPointX, startPointY, endPointX, endPointY)
          : getBresenhamPoints(startPointX, startPointY, endPointX, endPointY);
      points = applyLineStyle(rawPoints, lineStyle);
      break;
    }
    case "midpoint_circle": {
      const radius = Math.max(
        1,
        Math.round(
          Math.hypot(endPointX - startPointX, endPointY - startPointY),
        ),
      );
      points = getMidpointCircle(startPointX, startPointY, radius);
      break;
    }
    case "elips": {
      const radiusX = Math.max(1, Math.abs(endPointX - startPointX));
      const radiusY = Math.max(1, Math.abs(endPointY - startPointY));
      points = getMidpointEllipse(startPointX, startPointY, radiusX, radiusY);
      break;
    }
    case "square": {
      const rawPoints = getSquarePoints(startPointX, startPointY, endPointX, endPointY);
      points = applyLineStyle(rawPoints, lineStyle);
      break;
    }
    case "rectangle": {
      const rawPoints = getRectanglePoints(startPointX, startPointY, endPointX, endPointY);
      points = applyLineStyle(rawPoints, lineStyle);
      break;
    }
    case "triangle": {
      const triType = triangleTypeSelect ? triangleTypeSelect.value : "right";
      const rawPoints = getTrianglePoints(startPointX, startPointY, endPointX, endPointY, triType);
      points = applyLineStyle(rawPoints, lineStyle);
      break;
    }
    default:
      return null;
  }

  drawPoints(points, strokeColor, lineWidth);
  return boundsFromPoints(points);
}

function restorePreviewBase() {
  if (previewSnapshot) {
    ctx.putImageData(previewSnapshot, 0, 0);
  }
}

function cancelPreview() {
  isDrawing = false;
  previewSnapshot = null;
  currentX = 0;
  currentY = 0;

  if (previewFrameId !== null) {
    cancelAnimationFrame(previewFrameId);
    previewFrameId = null;
  }
}

function schedulePreviewRender() {
  if (
    !isDrawing ||
    !previewSnapshot ||
    previewFrameId !== null ||
    !shouldPreviewShape(currentShape)
  ) {
    return;
  }

  previewFrameId = requestAnimationFrame(() => {
    previewFrameId = null;
    restorePreviewBase();
    renderShape(startX, startY, currentX, currentY, colorPicker.value, true);
  });
}

function finalizeShape(endX, endY) {
  restorePreviewBase();
  const bounds = renderShape(
    startX,
    startY,
    endX,
    endY,
    colorPicker.value,
    false,
  );

  if (bounds) {
    lastShapeBounds = bounds;
  }

  lastStrokeColor = colorPicker.value;
}

function applyFill() {
  const fillMethod = fillSelect.value;
  const fillColor = hexToRgba(colorPicker.value);
  const seedX = lastShapeBounds
    ? Math.round((lastShapeBounds.minX + lastShapeBounds.maxX) / 2)
    : Math.floor(canvas.width / 2);
  const seedY = lastShapeBounds
    ? Math.round((lastShapeBounds.minY + lastShapeBounds.maxY) / 2)
    : Math.floor(canvas.height / 2);

  if (fillMethod === "Scan Line") {
    const bounds = lastShapeBounds || {
      minX: seedX - 20,
      maxX: seedX + 20,
      minY: seedY - 20,
      maxY: seedY + 20,
    };

    scanLineFill(
      ctx,
      [
        { x: bounds.minX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.maxY },
        { x: bounds.minX, y: bounds.maxY },
      ],
      rgbaToCss(fillColor),
    );
    return;
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (fillMethod === "Flood Fill") {
    floodFill(imgData, canvas.width, canvas.height, seedX, seedY, fillColor);
    ctx.putImageData(imgData, 0, 0);
    return;
  }

  if (fillMethod === "Boundary Fill") {
    boundaryFill(
      imgData,
      canvas.width,
      canvas.height,
      seedX,
      seedY,
      fillColor,
      hexToRgba(lastStrokeColor),
    );
    ctx.putImageData(imgData, 0, 0);
  }
}

shapeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveShape(button.dataset.shape);
  });
});

canvas.addEventListener("mousedown", (event) => {
  const point = getCanvasPoint(event);
  startX = point.x;
  startY = point.y;
  currentX = point.x;
  currentY = point.y;
  isDrawing = true;
  previewSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing || !shouldPreviewShape(currentShape)) {
    return;
  }

  const point = getCanvasPoint(event);
  currentX = point.x;
  currentY = point.y;
  schedulePreviewRender();
});

canvas.addEventListener("mouseup", (event) => {
  if (!isDrawing) {
    return;
  }

  const point = getCanvasPoint(event);
  currentX = point.x;
  currentY = point.y;
  finalizeShape(currentX, currentY);
  cancelPreview();
});

canvas.addEventListener("mouseleave", () => {
  if (!isDrawing) {
    return;
  }

  restorePreviewBase();
  cancelPreview();
});

applyFillBtn.addEventListener("click", applyFill);

document.getElementById("clearBtn").addEventListener("click", () => {
  clearCanvas();
  lastShapeBounds = null;
  previewSnapshot = null;
  cancelPreview();
});

setActiveShape(currentShape);
