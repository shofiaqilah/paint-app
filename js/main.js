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
import { getPixelColor, setPixelColor, colorsMatch, hexToRgba, rgbaToCss } from "./algorithms/warna/helper.js";
import { canvas, ctx, clearCanvas } from "./utils/canvas.js";

// JALUR IMPOR ALGORITMA PEN (Disesuaikan dengan struktur folder sesungguhnya)
import { drawAirbrush } from "./pen/airbrush.js";
import { drawMarker } from "./pen/marker.js";
import { drawPen } from "./pen/pen.js";
import { drawPencil } from "./pen/pencil.js";
import { drawWatercolor } from "./pen/watercolor.js";

// =========================================================================
// KANVAS BAYANGAN (OFFSCREEN LAYER) UNTUK MENGGAMBAR BEBAS TANPA LAG
// =========================================================================
const offscreenCanvas = document.createElement("canvas");
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;
const offscreenCtx = offscreenCanvas.getContext("2d");
offscreenCtx.imageSmoothingEnabled = false;

// =========================================================================
// STATE MANAGEMENT & UI ELEMENTS
// =========================================================================
const colorPicker = document.getElementById("colorPicker");
const lineTypeSelect = document.getElementById("lineTypeSelect");
const lineStyleSelect = document.getElementById("lineStyleSelect");
const triangleTypeSelect = document.getElementById("triangleTypeSelect");
const lineWidthInput = document.getElementById("lineWidthInput");
const fillSelect = document.getElementById("fillSelect");
const applyFillBtn = document.getElementById("applyFillBtn");
const shapeButtons = document.querySelectorAll(".shape-btn");

// State Aplikasi
let shapesList = [];             // Hanya menampung objek geometri yang dapat dipilih/diformat
let selectedShapeIndex = null;   // Indeks objek yang sedang di-select
let currentShape = "bresenham_line"; // Tool aktif
let isDrawing = false;

// Koordinat Mouse
let startX = 0, startY = 0;
let lastX = 0, lastY = 0;
let currentX = 0, currentY = 0;
let previewSnapshot = null;

ctx.imageSmoothingEnabled = false;

// Fungsi pembantu untuk mendeteksi apakah tool saat ini adalah tipe menggambar bebas (tidak selectable)
function isFreehandTool(shape) {
  return shape === "freehand" || ["pencil", "pen", "marker", "airbrush", "watercolor", "eraser"].includes(shape);
}

// Mendapatkan fungsi gambar sesuai jenis pen/kuas
function getFreehandDrawFunc(subType) {
  switch (subType) {
    case "pencil": return drawPencil;
    case "marker": return drawMarker;
    case "watercolor": return drawWatercolor;
    case "pen": 
    case "freehand":
    default:
      return drawPen;
  }
}

// =========================================================================
// MANAGEMENT CORE: DRAW ALL SHAPES (MENDUKUNG LAYER RASTER & VEKTOR)
// =========================================================================
function drawAllShapes() {
  // Bersihkan layar fisik utama
  clearCanvas();

  // 1. Gambar layer lukisan bebas (Raster) dari Kanvas Bayangan terlebih dahulu
  ctx.drawImage(offscreenCanvas, 0, 0);

  // 2. Gambar semua objek geometris yang ada di shapesList (Vector/Object Layer)
  shapesList.forEach((shape, index) => {
    // Jalankan Algoritma Fill Terlebih Dahulu (jika ada)
    if (shape.fillMethod && shape.fillColor) {
      renderShapeFillDirect(shape);
    }

    // Kalkulasi Titik Pinggiran (Stroke) Berdasarkan Tipe Objek
    let points = [];
    if (shape.type === "bresenham_line") {
      points = shape.lineAlgorithm === "DDA"
        ? getDdaPoints(shape.vertices[0].x, shape.vertices[0].y, shape.vertices[1].x, shape.vertices[1].y)
        : getBresenhamPoints(shape.vertices[0].x, shape.vertices[0].y, shape.vertices[1].x, shape.vertices[1].y);
    } 
    else if (["square", "rectangle", "triangle"].includes(shape.type) || (shape.type === "elips" && shape.vertices.length > 0)) {
      const n = shape.vertices.length;
      for (let i = 0; i < n; i++) {
        const p0 = shape.vertices[i];
        const p1 = shape.vertices[(i + 1) % n];
        const edgePoints = getBresenhamPoints(Math.round(p0.x), Math.round(p0.y), Math.round(p1.x), Math.round(p1.y));
        points.push(...edgePoints);
      }
    } 
    else if (shape.type === "midpoint_circle") {
      points = getMidpointCircle(shape.center.x, shape.center.y, shape.radiusX);
    } 
    else if (shape.type === "elips" && shape.vertices.length === 0) {
      points = getMidpointEllipse(shape.center.x, shape.center.y, shape.radiusX, shape.radiusY);
    }

    const styledPoints = applyLineStyle(points, shape.lineStyle);
    drawPoints(styledPoints, shape.strokeColor, shape.lineWidth);

    // Beri Penanda Visual (Bounding Box) Jika Objek Sedang Di-select
    if (index === selectedShapeIndex) {
      drawSelectionBoundingBox(shape);
    }
  });
}

// Fungsi pembantu untuk menghasilkan koordinat sudut buatan (poligon) untuk lingkaran/elips
function generateVerticesForCircleOrEllipse(shape) {
  const vertices = [];
  const totalPoints = 36;
  
  for (let i = 0; i < totalPoints; i++) {
    const angle = (i * 2 * Math.PI) / totalPoints;
    const x = shape.center.x + shape.radiusX * Math.cos(angle);
    const y = shape.center.y + shape.radiusY * Math.sin(angle);
    vertices.push({ x: Math.round(x), y: Math.round(y) });
  }
  return vertices;
}

// Fungsi pembantu untuk merender fill langsung dari data objek
function renderShapeFillDirect(shape) {
  const fillColorCss = rgbaToCss(hexToRgba(shape.fillColor));
  const strokeRgb = hexToRgba(shape.strokeColor);

  let targetVertices = [...shape.vertices];
  if (["midpoint_circle", "elips"].includes(shape.type)) {
    targetVertices = generateVerticesForCircleOrEllipse(shape);
  }
  
  if (shape.fillMethod === "Scan Line" && targetVertices.length >= 3) {
    scanLineFill(ctx, targetVertices, fillColorCss);
  } 
  else if (shape.fillMethod === "Inside-Outside" && targetVertices.length >= 3) {
    insideOutsideFill(ctx, targetVertices, fillColorCss);
  } 
  else if (["Flood Fill", "Boundary Fill"].includes(shape.fillMethod)) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    let seedX = Math.round(shape.center.x);
    let seedY = Math.round(shape.center.y);

    const currentPixelColor = getPixelColor(imgData, seedX, seedY, canvas.width);
    if (colorsMatch(currentPixelColor, strokeRgb)) {
      seedX += 2;
      seedY += 2;
    }

    if (seedX >= 0 && seedX < canvas.width && seedY >= 0 && seedY < canvas.height) {
      if (shape.fillMethod === "Flood Fill") {
        floodFill(imgData, canvas.width, canvas.height, seedX, seedY, hexToRgba(shape.fillColor));
      } else {
        boundaryFill(imgData, canvas.width, canvas.height, seedX, seedY, hexToRgba(shape.fillColor), strokeRgb);
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }
}

// Menggambar kotak putus-putus di sekitar objek yang aktif diselek
function drawSelectionBoundingBox(shape) {
  const bounds = boundsFromShape(shape);
  if (!bounds) return;

  ctx.strokeStyle = "#2d7ff9";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(
    bounds.minX - 5, 
    bounds.minY - 5, 
    (bounds.maxX - bounds.minX) + 10, 
    (bounds.maxY - bounds.minY) + 10
  );
  ctx.setLineDash([]);
}

// =========================================================================
// UTILITIES & GEOMETRY HELPERS
// =========================================================================
function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(event.clientX - rect.left),
    y: Math.floor(event.clientY - rect.top),
  };
}

function boundsFromShape(shape) {
  if (["midpoint_circle", "elips"].includes(shape.type)) {
    return {
      minX: shape.center.x - shape.radiusX,
      maxX: shape.center.x + shape.radiusX,
      minY: shape.center.y - shape.radiusY,
      maxY: shape.center.y + shape.radiusY
    };
  }
  if (shape.vertices.length === 0) return null;
  const xs = shape.vertices.map(v => v.x);
  const ys = shape.vertices.map(v => v.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

function updateShapeCenter(shape) {
  const bounds = boundsFromShape(shape);
  if (bounds) {
    shape.center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };
  }
}

function drawPoints(points, color, size = 1) {
  const seen = new Set();
  const roundedSize = Math.max(1, parseInt(size, 10) || 1);
  ctx.fillStyle = color;
  for (const point of points) {
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    const key = `${x}:${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    const offset = Math.floor(roundedSize / 2);
    ctx.fillRect(x - offset, y - offset, roundedSize, roundedSize);
  }
}

// =========================================================================
// MODE SELECT: HIT TESTING (DETEKSI KLIK)
// =========================================================================
function performHitTest(clickX, clickY) {
  for (let i = shapesList.length - 1; i >= 0; i--) {
    const shape = shapesList[i];
    const bounds = boundsFromShape(shape);
    if (!bounds) continue;

    const padding = 6;
    if (clickX >= bounds.minX - padding && clickX <= bounds.maxX + padding &&
        clickY >= bounds.minY - padding && clickY <= bounds.maxY + padding) {
      return i;
    }
  }
  return null;
}

// =========================================================================
// TOOL & MODE SWITCHERS
// =========================================================================
function setActiveShape(shape) {
  currentShape = shape;

  const trianglePanel = document.getElementById("triangleTypePanel");
  if (trianglePanel) trianglePanel.style.display = shape === "triangle" ? "inline-flex" : "none";

  const lineTypePanel = document.getElementById("lineTypePanel");
  if (lineTypePanel) lineTypePanel.style.display = shape === "bresenham_line" ? "inline-flex" : "none";

  shapeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.shape === shape);
  });

  if (shape !== "select_mode") {
    selectedShapeIndex = null;
    drawAllShapes();
  }

  const footer = document.querySelector(".footer");
  if (footer) {
    if (shape === "select_mode") {
      footer.textContent = "Tool aktif : Mode Select (Klik pada bangun ruang)";
    } else {
      const labels = {
        bresenham_line: `Garis (${lineTypeSelect.value})`,
        midpoint_circle: "Lingkaran",
        elips: "Elips",
        square: "Persegi",
        rectangle: "Persegi Panjang",
        triangle: "Segitiga",
        freehand: "Menggambar Bebas",
        pencil: "Pensil",
        pen: "Pen",
        marker: "Marker",
        airbrush: "Airbrush",
        watercolor: "Watercolor",
        eraser: "Penghapus"
      };
      footer.textContent = `Tool aktif : ${labels[shape] || shape}`;
    }
  }
}

// =========================================================================
// MOUSE EVENTS: LOGIKA DIUBAH AGAR MENGGAMBAR LANGSUNG DI KANVAS BAYANGAN
// =========================================================================
canvas.addEventListener("mousedown", (event) => {
  const point = getCanvasPoint(event);
  startX = point.x;
  startY = point.y;
  lastX = point.x;
  lastY = point.y;

  if (currentShape === "select_mode") {
    const hitIndex = performHitTest(startX, startY);
    selectedShapeIndex = hitIndex;
    drawAllShapes();
  } else if (isFreehandTool(currentShape)) {
    isDrawing = true;
    
    // Tentukan jenis kuas aktif
    const activeSubType = currentShape === "freehand" ? "pen" : currentShape;
    let brushSize = parseInt(lineWidthInput.value, 10) || 4;
    if (activeSubType === "pencil") brushSize = 1;
    if (activeSubType === "eraser") brushSize = 20;

    // GAMBAR TITIK AWAL PADA KANVAS BAYANGAN (OFFSCREEN)
    if (activeSubType === "eraser") {
      offscreenCtx.save();
      offscreenCtx.fillStyle = "#ffffff";
      offscreenCtx.fillRect(startX - brushSize / 2, startY - brushSize / 2, brushSize, brushSize);
      offscreenCtx.restore();
    } else if (activeSubType === "airbrush") {
      drawAirbrush(offscreenCtx, startX, startY, colorPicker.value, brushSize);
    } else {
      const drawFunc = getFreehandDrawFunc(activeSubType);
      drawFunc(offscreenCtx, startX, startY, startX, startY, colorPicker.value, brushSize);
    }

    // Tampilkan di kanvas utama secara instan
    drawAllShapes();
  } else {
    isDrawing = true;
    previewSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;

  const point = getCanvasPoint(event);
  currentX = point.x;
  currentY = point.y;

  if (isFreehandTool(currentShape)) {
    const activeSubType = currentShape === "freehand" ? "pen" : currentShape;
    let brushSize = parseInt(lineWidthInput.value, 10) || 4;
    if (activeSubType === "pencil") brushSize = 1;
    if (activeSubType === "eraser") brushSize = 20;

    // LUKIS GORESAN SEPANJANG GERAKAN MOUSE PADA KANVAS BAYANGAN
    if (activeSubType === "eraser") {
      offscreenCtx.save();
      offscreenCtx.fillStyle = "#ffffff";
      offscreenCtx.fillRect(currentX - brushSize / 2, currentY - brushSize / 2, brushSize, brushSize);
      offscreenCtx.restore();
    } else if (activeSubType === "airbrush") {
      drawAirbrush(offscreenCtx, currentX, currentY, colorPicker.value, brushSize);
    } else {
      const drawFunc = getFreehandDrawFunc(activeSubType);
      drawFunc(offscreenCtx, lastX, lastY, currentX, currentY, colorPicker.value, brushSize);
    }

    // Geser koordinat terakhir untuk gerakan kontinu
    lastX = currentX;
    lastY = currentY;

    // Refresh gambar gabungan ke layar utama
    drawAllShapes();
    return;
  }

  // RENDER LIVE PREVIEW UNTUK GEOMETRIS (VEKTOR)
  if (previewSnapshot) {
    ctx.putImageData(previewSnapshot, 0, 0);
  }

  let tempShape = {
    type: currentShape,
    lineAlgorithm: lineTypeSelect.value,
    lineStyle: lineStyleSelect.value.toLowerCase().replace(" ", "-"),
    strokeColor: rgbaToCss({ ...hexToRgba(colorPicker.value), a: 90 }), 
    lineWidth: parseInt(lineWidthInput.value, 10) || 1,
    vertices: getShapeVertices(currentShape, startX, startY, currentX, currentY),
    center: { x: (startX + currentX) / 2, y: (startY + currentY) / 2 },
    radiusX: Math.abs(currentX - startX),
    radiusY: Math.abs(currentY - startY)
  };

  if (currentShape === "midpoint_circle") {
    const r = Math.round(Math.hypot(currentX - startX, currentY - startY));
    tempShape.radiusX = r;
    tempShape.radiusY = r;
    tempShape.center = { x: startX, y: startY };
  }

  shapesList.push(tempShape);
  drawAllShapes();
  shapesList.pop();
});

canvas.addEventListener("mouseup", (event) => {
  if (!isDrawing) return;
  isDrawing = false;

  if (isFreehandTool(currentShape)) {
    // Selesai menggambar bebas, gambar permanen di offscreenCanvas dan tidak tersimpan di shapesList
    drawAllShapes();
    return;
  }

  const point = getCanvasPoint(event);
  currentX = point.x;
  currentY = point.y;

  const rawStyle = lineStyleSelect ? lineStyleSelect.value.toLowerCase() : "solid";
  let finalShape = {
    id: Date.now(),
    type: currentShape,
    lineAlgorithm: lineTypeSelect.value,
    lineStyle: rawStyle.replace(" ", "-"),
    strokeColor: colorPicker.value,
    lineWidth: parseInt(lineWidthInput.value, 10) || 1,
    vertices: getShapeVertices(currentShape, startX, startY, currentX, currentY),
    center: { x: (startX + currentX) / 2, y: (startY + currentY) / 2 },
    radiusX: Math.abs(currentX - startX),
    radiusY: Math.abs(currentY - startY),
    fillMethod: null,
    fillColor: null
  };

  if (currentShape === "midpoint_circle") {
    const r = Math.round(Math.hypot(currentX - startX, currentY - startY));
    finalShape.radiusX = r;
    finalShape.radiusY = r;
    finalShape.center = { x: startX, y: startY };
  }

  shapesList.push(finalShape);
  selectedShapeIndex = shapesList.length - 1;
  drawAllShapes();
});

// Menghasilkan koordinat pojok poligon / garis
function getShapeVertices(shape, x0, y0, x1, y1) {
  switch (shape) {
    case "bresenham_line":
      return [{ x: x0, y: y0 }, { x: x1, y: y1 }];

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

// =========================================================================
// LOGIKA FILL (BERLAKU UNTUK BANGUNAN YANG SEDANG DI-SELECT)
// =========================================================================
function applyFill() {
  if (selectedShapeIndex === null) {
    alert("Gunakan Mode Select lalu pilih satu objek terlebih dahulu untuk melakukan Fill!");
    return;
  }

  let shape = shapesList[selectedShapeIndex];
  shape.fillMethod = fillSelect.value;
  shape.fillColor = colorPicker.value;

  drawAllShapes();
}
applyFillBtn.addEventListener("click", applyFill);

// =========================================================================
// EVENT LISTENERS: TRANSFORMASI
// =========================================================================

// 1. TRANSLASI (KOMPAS)
document.querySelectorAll("[id='btn-translate']").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (selectedShapeIndex === null) return;
    let shape = shapesList[selectedShapeIndex];

    const step = Number.parseFloat(document.getElementById("translateStep").value) || 20;
    const tx = Number.parseInt(btn.dataset.tx) * step;
    const ty = Number.parseInt(btn.dataset.ty) * step;

    shape.center.x += tx;
    shape.center.y += ty;

    if (shape.vertices.length > 0) {
      shape.vertices = translate(shape.vertices, tx, ty);
    }

    drawAllShapes();
  });
});

// 2. ROTASI
document.getElementById("btn-rotate-left").addEventListener("click", () => {
  if (selectedShapeIndex === null) return;
  let shape = shapesList[selectedShapeIndex];
  const angle = Number.parseFloat(document.getElementById("rotateAngle").value) || 45;

  if (shape.type === "elips" && shape.vertices.length === 0) {
    shape.vertices = generateVerticesForCircleOrEllipse(shape);
  }

  if (shape.vertices.length > 0) {
    shape.vertices = rotate(shape.vertices, angle, shape.center);
  }
  drawAllShapes();
});

document.getElementById("btn-rotate-right").addEventListener("click", () => {
  if (selectedShapeIndex === null) return;
  let shape = shapesList[selectedShapeIndex];
  const angle = Number.parseFloat(document.getElementById("rotateAngle").value) || 45;
  if (shape.type === "elips" && shape.vertices.length === 0) {
    shape.vertices = generateVerticesForCircleOrEllipse(shape);
  }

  if (shape.vertices.length > 0) {
    shape.vertices = rotate(shape.vertices, -angle, shape.center);
  }
  drawAllShapes();
});

// 3. SCALING
document.getElementById("btn-scale").addEventListener("click", () => {
  if (selectedShapeIndex === null) return;
  let shape = shapesList[selectedShapeIndex];
  const sx = Number.parseFloat(document.getElementById("scaleSx").value) || 1;
  const sy = Number.parseFloat(document.getElementById("scaleSy").value) || 1;

  if (["midpoint_circle", "elips"].includes(shape.type)) {
    shape.radiusX = Math.round(shape.radiusX * sx);
    shape.radiusY = Math.round(shape.radiusY * sy);
    
    if (shape.type === "midpoint_circle" && sx !== sy) {
      shape.type = "elips";
    }
  } else if (shape.vertices.length > 0) {
    shape.vertices = scale(shape.vertices, sx, sy, shape.center);
    updateShapeCenter(shape);
  }

  drawAllShapes();
});

// 4. REFLEKSI
document.querySelectorAll("[id='btn-reflect']").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (selectedShapeIndex === null) return;
    let shape = shapesList[selectedShapeIndex];
    const axis = btn.dataset.axis;

    if (["midpoint_circle", "elips"].includes(shape.type) && shape.vertices.length === 0) {
      return; 
    }

    if (shape.vertices.length > 0) {
      if (axis === "XY") {
        shape.vertices = shape.vertices.map(v => ({
          x: shape.center.x + (v.y - shape.center.y),
          y: shape.center.y + (v.x - shape.center.x),
        }));
      } else if (axis === "ORIGIN") {
        shape.vertices = shape.vertices.map(v => ({
          x: shape.center.x - (v.y - shape.center.y),
          y: shape.center.y - (v.x - shape.center.x),
        }));
      } else if (axis === "X") {
        shape.vertices = translate(reflect(translate(shape.vertices, 0, -shape.center.y), "X"), 0, shape.center.y);
      } else if (axis === "Y") {
        shape.vertices = translate(reflect(translate(shape.vertices, -shape.center.x, 0), "Y"), shape.center.x, 0);
      }
      updateShapeCenter(shape);
    }

    drawAllShapes();
  });
});

// 5. SHEAR
document.getElementById("btn-shear").addEventListener("click", () => {
  if (selectedShapeIndex === null) return;
  let shape = shapesList[selectedShapeIndex];
  const shx = Number.parseFloat(document.getElementById("shearShx").value) || 0;
  const shy = Number.parseFloat(document.getElementById("shearShy").value) || 0;

  if (shape.vertices.length > 0) {
    shape.vertices = shear(shape.vertices, shx, shy);
    updateShapeCenter(shape);
  }
  drawAllShapes();
});

// =========================================================================
// EVENT LISTENERS GLOBAL BUTTONS
// =========================================================================
shapeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveShape(button.dataset.shape);
  });
});

document.getElementById("clearBtn").addEventListener("click", () => {
  shapesList = [];
  selectedShapeIndex = null;
  previewSnapshot = null;
  
  // Bersihkan kanvas utama dan kanvas bayangan (offscreen) sekaligus
  offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  clearCanvas();
});

// =========================================================================
// EVENT LISTENER: HAPUS OBJEK YANG SEDANG DI-SELECT
// =========================================================================
document.getElementById("deleteShapeBtn").addEventListener("click", () => {
  if (selectedShapeIndex === null) {
    alert("Silakan gunakan 'Mode Select' lalu klik pada salah satu objek terlebih dahulu untuk menghapusnya!");
    return;
  }

  shapesList.splice(selectedShapeIndex, 1);
  selectedShapeIndex = null;
  drawAllShapes();
});

// Jalankan set awal aplikasi
setActiveShape(currentShape);