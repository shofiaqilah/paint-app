import { getBresenhamPoints } from "./algorithms/bresenham_line.js";
import { getDdaPoints, applyLineStyle } from "./algorithms/dda_line.js";
import { getMidpointCircle } from "./algorithms/midpoint_circle.js";
import { getMidpointEllipse } from "./algorithms/midpoint_ellipse.js";
import { getSquarePoints, getRectanglePoints, getTrianglePoints } from "./shapes/shapes.js";
import { scanLineFill } from "./algorithms/warna/scanline.js";
import { floodFill } from "./algorithms/warna/floodfill.js";
import { boundaryFill } from "./algorithms/warna/boundaryfill.js";
import { insideOutsideFill } from "./algorithms/warna/insideoutside.js";
import { translate, scale, rotate, reflect, shear } from "./algorithms/transformasi/transformasi.js";
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
// Vertices shape terakhir — dipakai untuk transformasi & inside-outside fill
let lastVertices = [];

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

  // Simpan vertices shape tertutup untuk transformasi & fill
  lastVertices = getShapeVertices(currentShape, startX, startY, endX, endY);
  lastStrokeColor = colorPicker.value;
}

/**
 * Mengembalikan vertices (pojok-pojok) shape untuk keperluan transformasi & fill.
 * Hanya shape tertutup yang menghasilkan vertices bermakna.
 */
function getShapeVertices(shape, x0, y0, x1, y1) {
  switch (shape) {
    case "square": {
      const side = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0));
      const signX = x1 >= x0 ? 1 : -1;
      const signY = y1 >= y0 ? 1 : -1;
      const x2 = x0 + signX * side;
      const y2 = y0 + signY * side;
      return [{ x: x0, y: y0 }, { x: x2, y: y0 }, { x: x2, y: y2 }, { x: x0, y: y2 }];
    }
    case "rectangle":
      return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
    case "triangle": {
      const triType = triangleTypeSelect ? triangleTypeSelect.value : "right";
      if (triType === "isosceles") {
        return [{ x: Math.round((x0 + x1) / 2), y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
      } else if (triType === "equilateral") {
        const base = Math.abs(x1 - x0);
        const height = Math.round((Math.sqrt(3) / 2) * base);
        const signY = y1 >= y0 ? 1 : -1;
        const midX = Math.round((x0 + x1) / 2);
        return [{ x: x0, y: y0 + signY * height }, { x: x1, y: y0 + signY * height }, { x: midX, y: y0 }];
      } else {
        return [{ x: x0, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
      }
    }
    default:
      return [];
  }
}

function applyFill() {
  const fillMethod = fillSelect.value;
  const fillColor = hexToRgba(colorPicker.value);
  const fillColorCss = rgbaToCss(fillColor);
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
    const verts = lastVertices.length >= 3
      ? lastVertices
      : [
          { x: bounds.minX, y: bounds.minY },
          { x: bounds.maxX, y: bounds.minY },
          { x: bounds.maxX, y: bounds.maxY },
          { x: bounds.minX, y: bounds.maxY },
        ];
    scanLineFill(ctx, verts, fillColorCss);
    return;
  }

  if (fillMethod === "Inside-Outside") {
    if (lastVertices.length < 3) {
      alert("Gambar shape tertutup (segitiga/persegi/persegi panjang) terlebih dahulu.");
      return;
    }
    insideOutsideFill(ctx, lastVertices, fillColorCss);
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
  lastVertices = [];
  previewSnapshot = null;
  cancelPreview();
});

// =============================================
// TRANSFORMASI — event listeners
// =============================================

/**
 * Menggambar ulang canvas dari vertices yang sudah ditransformasi.
 * Hapus canvas lalu gambar ulang shape dengan vertices baru.
 */
function redrawFromVertices(vertices) {
  if (vertices.length === 0) return;
  clearCanvas();

  const lineWidth = Number.parseInt(lineWidthInput.value, 10) || 1;
  const color = lastStrokeColor;

  // Gambar setiap sisi poligon menggunakan Bresenham
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const p0 = vertices[i];
    const p1 = vertices[(i + 1) % n];
    const pts = getBresenhamPoints(Math.round(p0.x), Math.round(p0.y), Math.round(p1.x), Math.round(p1.y));
    drawPoints(pts, color, lineWidth);
  }

  // Update bounds
  lastShapeBounds = {
    minX: Math.min(...vertices.map(v => v.x)),
    maxX: Math.max(...vertices.map(v => v.x)),
    minY: Math.min(...vertices.map(v => v.y)),
    maxY: Math.max(...vertices.map(v => v.y)),
  };
}

// Pusat shape saat ini
function getShapeCenter() {
  if (lastVertices.length === 0) return { x: canvas.width / 2, y: canvas.height / 2 };
  const xs = lastVertices.map(v => v.x);
  const ys = lastVertices.map(v => v.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

// TRANSLASI — tombol kompas
document.querySelectorAll("[id='btn-translate']").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (lastVertices.length === 0) return;
    const step = Number.parseFloat(document.getElementById("translateStep").value) || 20;
    const tx = Number.parseInt(btn.dataset.tx) * step;
    const ty = Number.parseInt(btn.dataset.ty) * step;
    lastVertices = translate(lastVertices, tx, ty);
    redrawFromVertices(lastVertices);
  });
});

// ROTASI
document.getElementById("btn-rotate-left").addEventListener("click", () => {
  if (lastVertices.length === 0) return;
  const angle = Number.parseFloat(document.getElementById("rotateAngle").value) || 45;
  const center = getShapeCenter();
  lastVertices = rotate(lastVertices, angle, center);
  redrawFromVertices(lastVertices);
});

document.getElementById("btn-rotate-right").addEventListener("click", () => {
  if (lastVertices.length === 0) return;
  const angle = Number.parseFloat(document.getElementById("rotateAngle").value) || 45;
  const center = getShapeCenter();
  lastVertices = rotate(lastVertices, -angle, center);
  redrawFromVertices(lastVertices);
});

// SCALING
document.getElementById("btn-scale").addEventListener("click", () => {
  if (lastVertices.length === 0) return;
  const sx = Number.parseFloat(document.getElementById("scaleSx").value) || 1;
  const sy = Number.parseFloat(document.getElementById("scaleSy").value) || 1;
  const center = getShapeCenter();
  lastVertices = scale(lastVertices, sx, sy, center);
  redrawFromVertices(lastVertices);
});

// REFLEKSI
document.querySelectorAll("[id='btn-reflect']").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (lastVertices.length === 0) return;
    const axis = btn.dataset.axis;

    if (axis === "XY") {
      // y = x: tukar x dan y terhadap pusat
      const center = getShapeCenter();
      lastVertices = lastVertices.map(v => ({
        x: center.x + (v.y - center.y),
        y: center.y + (v.x - center.x),
      }));
    } else if (axis === "ORIGIN") {
      // y = -x: tukar dan negate terhadap pusat
      const center = getShapeCenter();
      lastVertices = lastVertices.map(v => ({
        x: center.x - (v.y - center.y),
        y: center.y - (v.x - center.x),
      }));
    } else {
      // Sumbu X atau Y — refleksi terhadap pusat shape
      const center = getShapeCenter();
      if (axis === "X") {
        lastVertices = lastVertices.map(v => ({ x: v.x, y: 2 * center.y - v.y }));
      } else {
        lastVertices = lastVertices.map(v => ({ x: 2 * center.x - v.x, y: v.y }));
      }
    }
    redrawFromVertices(lastVertices);
  });
});

// SHEAR
document.getElementById("btn-shear").addEventListener("click", () => {
  if (lastVertices.length === 0) return;
  const shx = Number.parseFloat(document.getElementById("shearShx").value) || 0;
  const shy = Number.parseFloat(document.getElementById("shearShy").value) || 0;
  lastVertices = shear(lastVertices, shx, shy);
  redrawFromVertices(lastVertices);
});

setActiveShape(currentShape);
