import { getBresenhamPoints } from "./algorithms/bresenham_line.js";
import { getDdaPoints, applyLineStyle } from "./algorithms/dda_line.js";
import { getMidpointCircle } from "./algorithms/midpoint_circle.js";
import { getMidpointEllipse } from "./algorithms/midpoint_ellipse.js";
import { getSquarePoints, getRectanglePoints, getTrianglePoints } from "./shapes/shapes.js";
import { scanLineFill } from "./algorithms/warna/scanline.js";
import { floodFill } from "./algorithms/warna/floodfill.js";
import { boundaryFill } from "./algorithms/warna/boundaryfill.js";
import { insideOutsideFill } from "./algorithms/warna/insideoutside.js";
import {
  translate,
  scale,
  rotate,
  reflect,
  shear,
  scaleEllipse,
  reflectEllipse,
  bakeCurveToVertices
} from "./algorithms/transformasi/transformasi.js";
import { drawPencil } from "./algorithms/pen/pencil.js";
import { drawMarker } from "./algorithms/pen/marker.js";
import { drawAirbrush } from "./algorithms/pen/airbrush.js";
import { hexToRgba, rgbaToCss } from "./algorithms/warna/helper.js";
import { canvas, ctx, clearCanvas } from "./utils/canvas.js";
import { drawTransformOverlay, hitTestHandles, getHandlePositions } from "./utils/transform_ui.js";

const colorPicker = document.getElementById("colorPicker");
const lineTypeSelect = document.getElementById("lineTypeSelect");
const lineStyleSelect = document.getElementById("lineStyleSelect");
const triangleTypeSelect = document.getElementById("triangleTypeSelect");
const lineWidthInput = document.getElementById("lineWidthInput");
const fillSelect = document.getElementById("fillSelect");
const shapeButtons = document.querySelectorAll(".shape-btn");

// TOAST NOTIFICATION [FIX: TRANSFORM]
function showToast(message) {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        toast.style.position = "fixed";
        toast.style.bottom = "40px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        toast.style.color = "white";
        toast.style.padding = "8px 16px";
        toast.style.borderRadius = "4px";
        toast.style.zIndex = "1000";
        toast.style.pointerEvents = "none";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = "block";
    
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
        toast.style.display = "none";
    }, 1500);
}

// BUG 3: Undo/Redo Setup
const MAX_HISTORY = 30;
let historyStack = [];
let redoStack = [];

function saveHistory() {
  historyStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
  redoStack = [];
}

function undo() {
  if (historyStack.length === 0) return;
  applySelection(); // Commit selection before undo [FIX: SELECT]
  redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  ctx.putImageData(historyStack.pop(), 0, 0);
}

function redo() {
  if (redoStack.length === 0) return;
  applySelection(); // Commit selection before redo [FIX: SELECT]
  historyStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  ctx.putImageData(redoStack.pop(), 0, 0);
}

document.addEventListener('keydown', (e) => {
  // [FIX: SELECT] Keyboard shortcuts
  if (currentShape === 'select' && hasSelectionBox) {
      if (e.key === 'Escape') {
          applySelection();
          return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
          saveHistory();
          const targets = getObjectsInSelection();
          if (targets.length > 0) {
              objects = objects.filter(obj => !targets.includes(obj));
              renderAllObjects();
          } else {
              // Fallback to bitmap delete only if no objects found
              ctx.fillStyle = "white";
              ctx.fillRect(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height);
          }
          stopMarchingAnts();
          hasSelectionBox = false;
          isDraggingSelection = false;
          selectedRegion = null;
          showToast("Objek/Area dihapus");
          return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
          if (isDraggingSelection && selectionImageData) {
              clipboardData = selectionImageData;
          } else {
              clipboardData = ctx.getImageData(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height);
          }
          showToast("Disalin ke clipboard");
          return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'x') {
          saveHistory();
          if (isDraggingSelection && selectionImageData) {
              clipboardData = selectionImageData;
              ctx.putImageData(selectionCanvasBackup, 0, 0);
          } else {
              clipboardData = ctx.getImageData(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height);
              ctx.putImageData(selectionSnapshot, 0, 0);
              ctx.fillStyle = "white";
              ctx.fillRect(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height);
          }
          stopMarchingAnts();
          hasSelectionBox = false;
          isDraggingSelection = false;
          selectedRegion = null;
          showToast("Dipotong ke clipboard");
          return;
      }
  }
  
  if (e.ctrlKey && e.key.toLowerCase() === 'v' && clipboardData) {
      setActiveShape('select');
      saveHistory();
      selectionSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      selectionCanvasBackup = selectionSnapshot;
      selectionImageData = clipboardData;
      selectedRegion = {
          x: Math.floor(canvas.width / 2 - clipboardData.width / 2),
          y: Math.floor(canvas.height / 2 - clipboardData.height / 2),
          width: clipboardData.width,
          height: clipboardData.height
      };
      isDraggingSelection = true;
      hasSelectionBox = true;
      startMarchingAnts();
      showToast("Ditempel dari clipboard");
      return;
  }

  if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
});

document.getElementById('btnUndo').addEventListener('click', undo);
document.getElementById('btnRedo').addEventListener('click', redo);

// BUG 7: Save
document.getElementById('btnSave').addEventListener('click', () => {
  applySelection(); // Commit selection before saving [FIX: SELECT]
  const link = document.createElement('a');
  link.download = 'paint2d-' + getTimestamp() + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

function getTimestamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '-',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join('');
}

// BUG 6: Color Picker
colorPicker.addEventListener('input', (e) => {
  lastStrokeColor = e.target.value;
});

document.querySelectorAll('.c-swatch').forEach(swatch => {
  swatch.addEventListener('click', (e) => {
    lastStrokeColor = e.target.dataset.color;
    colorPicker.value = lastStrokeColor;
  });
});

let currentShape = "bresenham_line";
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let currentX = 0;
let currentY = 0;
let isDrawing = false;
let previewSnapshot = null;
let previewFrameId = null;
let lastShapeBounds = null;
let lastStrokeColor = colorPicker.value;
// Daftar objek (Object List) untuk rendering berorientasi objek
let objects = []; 
// Referensi objek yang sedang dipilih/aktif
let selectedObjectId = null; 

// Vertices shape terakhir (masih digunakan untuk preview/shape yang sedang digambar)
let lastVertices = [];
// Metadata shape terakhir
let lastShapeMetadata = null; 
// Snapshot dasar sebelum aksi dimulai
let transformBaseSnapshot = null; 

// [FIX: SELECT] State for Selection Tool
let selectedRegion = null;
let hasSelectionBox = false;
let selectionSnapshot = null;
let clipboardData = null;
let isDraggingSelection = false;
let isDrawingSelection = false;
let isResizingSelection = false;
let activeHandle = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let selectionImageData = null;
let selectionCanvasBackup = null; 
let selectionAnimFrame = null;
let selectionDashOffset = 0;

ctx.imageSmoothingEnabled = false;

// Fungsi untuk menggambar ulang seluruh kanvas dari daftar objek
function renderAllObjects() {
    // [FIX: NON-DESTRUCTIVE] Gunakan snapshot latar belakang jika ada
    if (transformBaseSnapshot) {
        ctx.putImageData(transformBaseSnapshot, 0, 0);
    } else {
        clearCanvas();
    }

    objects.forEach(obj => {
        const lineWidth = obj.lineWidth || 1;
        const color = obj.color || "#000000";
        const style = obj.lineStyle || "solid";
        let points = [];

        // Gunakan algoritma asli untuk menjaga kualitas (Object-Based Redraw)
        if (obj.type === 'line') {
            points = obj.algo === 'DDA' 
                ? getDdaPoints(obj.x0, obj.y0, obj.x1, obj.y1)
                : getBresenhamPoints(obj.x0, obj.y0, obj.x1, obj.y1);
            points = applyLineStyle(points, style);
        } else if (obj.type === 'circle') {
            points = getMidpointCircle(obj.cx, obj.cy, obj.r, style);
        } else if (obj.type === 'ellipse') {
            points = getMidpointEllipse(obj.cx, obj.cy, obj.rx, obj.ry, style);
        } else if (obj.type === 'polygon') {
            const n = obj.vertices.length;
            for (let i = 0; i < n; i++) {
                const p0 = obj.vertices[i];
                const p1 = obj.vertices[(i + 1) % n];
                const linePts = getBresenhamPoints(Math.round(p0.x), Math.round(p0.y), Math.round(p1.x), Math.round(p1.y));
                points.push(...linePts);
            }
        }
        drawPoints(points, color, lineWidth);
    });
}

// Menambahkan objek baru ke dalam daftar
function addObject(objData) {
    objData.id = Date.now() + Math.random();
    objects.push(objData);
    renderAllObjects();
}

// Update properti objek spesifik
function updateObjectProperty(id, property, value) {
    const obj = objects.find(o => o.id === id);
    if (!obj) return;
    
    if (typeof property === 'object') {
        Object.assign(obj, property);
    } else {
        obj[property] = value;
    }
    renderAllObjects();
}

// [FIX: COORDS-SCALE] Get overlay canvas and sync its size
const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");

function syncOverlaySize() {
  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;
  const rect = canvas.getBoundingClientRect();
  overlayCanvas.style.width = rect.width + 'px';
  overlayCanvas.style.height = rect.height + 'px';
}
syncOverlaySize();
window.addEventListener('resize', syncOverlaySize);

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function shouldPreviewShape(shape) {
  return (
    shape === "bresenham_line" ||
    shape === "midpoint_circle" ||
    shape === "elips" ||
    shape === "square" ||
    shape === "rectangle" ||
    shape === "triangle" ||
    shape === "select"
  );
}

function isFreehandTool(shape) {
  return shape === "pencil" || shape === "marker" || shape === "airbrush";
}

function applySelection() {
  if (hasSelectionBox) {
    stopMarchingAnts();
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    hasSelectionBox = false;
    isDraggingSelection = false;
    selectionCanvasBackup = null;
    selectionImageData = null;
    selectedRegion = null;
    canvas.style.cursor = 'crosshair';
  }
}

// [FIX: SELECT] Animate the selection box on top of the original canvas
function startMarchingAnts() {
    stopMarchingAnts();
    function animate() {
        if (!hasSelectionBox || !selectedRegion) return;
        
        // Always update the overlay UI
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        
        overlayCtx.save();
        overlayCtx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        overlayCtx.lineWidth = 1;
        overlayCtx.setLineDash([5, 5]);
        selectionDashOffset--;
        overlayCtx.lineDashOffset = selectionDashOffset;
        overlayCtx.strokeRect(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height);
        
        overlayCtx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        overlayCtx.lineDashOffset = selectionDashOffset + 5;
        overlayCtx.strokeRect(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height);
        overlayCtx.restore();

        // Render Bounding Box and Handles
        drawTransformOverlay(overlayCtx, selectedRegion);
        
        selectionAnimFrame = requestAnimationFrame(animate);
    }
    animate();
}

function stopMarchingAnts() {
    if (selectionAnimFrame) {
        cancelAnimationFrame(selectionAnimFrame);
        selectionAnimFrame = null;
    }
}

function setActiveShape(shape) {
  applySelection(); // Commit active selection before changing tool [FIX: SELECT]

  currentShape = shape;

  const trianglePanel = document.getElementById("triangleTypePanel");
  if (trianglePanel) {
    trianglePanel.style.display = shape === "triangle" ? "inline-flex" : "none";
  }

  const lineTypePanel = document.getElementById("lineTypePanel");
  if (lineTypePanel) {
    lineTypePanel.style.display = shape === "bresenham_line" ? "inline-flex" : "none";
  }

  shapeButtons.forEach((button) => {
    button.classList.toggle("tool-active", button.dataset.shape === shape);
    button.classList.toggle("active", button.dataset.shape === shape);
  });

  const footer = document.querySelector(".footer");
  if (footer) {
    const labels = {
      bresenham_line: `Garis (${lineTypeSelect.value})`,
      midpoint_circle: "Lingkaran",
      elips: "Elips",
      square: "Persegi",
      rectangle: "Persegi Panjang",
      triangle: "Segitiga",
      pencil: "Pencil",
      marker: "Marker",
      airbrush: "Airbrush",
      select: "Select",
      fill: "Fill"
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
  let minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  return { minX, maxX, minY, maxY };
}

function renderShape(startPointX, startPointY, endPointX, endPointY, color, preview = false) {
  const lineWidth = Number.parseInt(lineWidthInput.value, 10) || 1;
  const strokeColor = preview ? rgbaToCss({ ...hexToRgba(color), a: 90 }) : color;

  const rawStyle = lineStyleSelect ? lineStyleSelect.value.toLowerCase() : "solid";
  const lineStyle = rawStyle.replace(" ", "-");

  if (currentShape === "select") {
    if (preview) {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      overlayCtx.save();
      overlayCtx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      overlayCtx.lineWidth = 1;
      overlayCtx.setLineDash([5, 5]);
      overlayCtx.strokeRect(startPointX, startPointY, endPointX - startPointX, endPointY - startPointY);
      
      overlayCtx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      overlayCtx.lineDashOffset = 5;
      overlayCtx.strokeRect(startPointX, startPointY, endPointX - startPointX, endPointY - startPointY);
      overlayCtx.restore();
    }
    return null;
  }

  let points = [];

  switch (currentShape) {
    case "bresenham_line": {
      const rawPoints = lineTypeSelect.value === "DDA"
          ? getDdaPoints(startPointX, startPointY, endPointX, endPointY)
          : getBresenhamPoints(startPointX, startPointY, endPointX, endPointY);
      points = applyLineStyle(rawPoints, lineStyle);
      break;
    }
    case "midpoint_circle": {
      const radius = Math.max(1, Math.round(Math.hypot(endPointX - startPointX, endPointY - startPointY)));
      points = getMidpointCircle(startPointX, startPointY, radius, lineStyle);
      break;
    }
    case "elips": {
      const radiusX = Math.max(1, Math.abs(endPointX - startPointX));
      const radiusY = Math.max(1, Math.abs(endPointY - startPointY));
      points = getMidpointEllipse(startPointX, startPointY, radiusX, radiusY, lineStyle);
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
  if (!isDrawing || !previewSnapshot || previewFrameId !== null || !shouldPreviewShape(currentShape)) {
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
  
  // [FIX: TRANSFORM] transformBaseSnapshot NO LONGER updated here to avoid pollution
  // It should only be updated by bitmap tools (pencil, fill)

  if (currentShape === "select") {
    const rx = Math.min(startX, endX);
    const ry = Math.min(startY, endY);
    const rw = Math.abs(endX - startX);
    const rh = Math.abs(endY - startY);
    
    if (rw > 0 && rh > 0) {
      selectedRegion = { x: rx, y: ry, width: rw, height: rh };
      // selectionSnapshot set to current background
      selectionSnapshot = transformBaseSnapshot;
      hasSelectionBox = true;
      startMarchingAnts();
    }
    return;
  }

  const lineWidth = Number.parseInt(lineWidthInput.value, 10) || 1;
  const color = colorPicker.value;
  const rawStyle = lineStyleSelect ? lineStyleSelect.value.toLowerCase() : "solid";
  const lineStyle = rawStyle.replace(" ", "-");

  // [FIX: OBJECT-ORIENTED] Create object data
  let newObj = {
      type: '',
      color: color,
      lineWidth: lineWidth,
      lineStyle: lineStyle
  };

  if (currentShape === "bresenham_line") {
      newObj.type = 'line';
      newObj.algo = lineTypeSelect.value;
      newObj.x0 = startX; newObj.y0 = startY;
      newObj.x1 = endX; newObj.y1 = endY;
  } else if (currentShape === "midpoint_circle") {
      const r = Math.max(1, Math.round(Math.hypot(endX - startX, endY - startY)));
      newObj.type = 'circle';
      newObj.cx = startX; newObj.cy = startY; newObj.r = r;
      lastShapeMetadata = { ...newObj }; 
  } else if (currentShape === "elips") {
      const rx = Math.max(1, Math.abs(endX - startX));
      const ry = Math.max(1, Math.abs(endY - startY));
      newObj.type = 'ellipse';
      newObj.cx = startX; newObj.cy = startY; newObj.rx = rx; newObj.ry = ry;
      lastShapeMetadata = { ...newObj };
  } else {
      const vertices = getShapeVertices(currentShape, startX, startY, endX, endY);
      if (vertices.length > 0) {
          newObj.type = 'polygon';
          newObj.vertices = vertices;
          lastVertices = vertices;
      } else {
          return;
      }
  }

  // Add to global object list and render
  addObject(newObj);
  lastStrokeColor = color;
}

// Fungsi untuk mendapatkan objek yang berada di dalam area seleksi [FIX: OBJECT-BASED]
function getObjectsInSelection() {
    if (!selectedRegion) return [];
    
    return objects.filter(obj => {
        let bounds = null;
        if (obj.type === 'line') {
            bounds = {
                minX: Math.min(obj.x0, obj.x1), maxX: Math.max(obj.x0, obj.x1),
                minY: Math.min(obj.y0, obj.y1), maxY: Math.max(obj.y0, obj.y1)
            };
        } else if (obj.type === 'circle') {
            bounds = {
                minX: obj.cx - obj.r, maxX: obj.cx + obj.r,
                minY: obj.cy - obj.r, maxY: obj.cy + obj.r
            };
        } else if (obj.type === 'ellipse') {
            bounds = {
                minX: obj.cx - obj.rx, maxX: obj.cx + obj.rx,
                minY: obj.cy - obj.ry, maxY: obj.cy + obj.ry
            };
        } else if (obj.type === 'polygon') {
            bounds = {
                minX: Math.min(...obj.vertices.map(v => v.x)),
                maxX: Math.max(...obj.vertices.map(v => v.x)),
                minY: Math.min(...obj.vertices.map(v => v.y)),
                maxY: Math.max(...obj.vertices.map(v => v.y))
            };
        }

        if (!bounds) return false;

        // Cek overlap antara bounds objek dan selectedRegion
        return (bounds.minX >= selectedRegion.x && 
                bounds.maxX <= selectedRegion.x + selectedRegion.width &&
                bounds.minY >= selectedRegion.y && 
                bounds.maxY <= selectedRegion.y + selectedRegion.height);
    });
}

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

shapeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveShape(button.dataset.shape);
  });
});

canvas.addEventListener("mousedown", (event) => {
  const point = getCanvasPoint(event);

  // [FIX: RESELECT] State machine logic for Selection Tool
  if (currentShape === "select") {
      if (hasSelectionBox && selectedRegion && 
          point.x >= selectedRegion.x && point.x <= selectedRegion.x + selectedRegion.width &&
          point.y >= selectedRegion.y && point.y <= selectedRegion.y + selectedRegion.height) {
          
          // User clicked INSIDE existing selection -> start drag-move
          if (!isDraggingSelection) {
              saveHistory();
              // [FIX: OBJECT-BASED DRAG] No longer capture ImageData or fillRect white
              isDraggingSelection = true;
          }
          
          dragOffsetX = point.x - selectedRegion.x;
          dragOffsetY = point.y - selectedRegion.y;
          isDrawing = true;
          return;
      } else {
          // User clicked OUTSIDE or no selection exists -> start NEW selection
          applySelection(); 
          isDrawingSelection = true;
      }
  }

  startX = point.x;
  startY = point.y;
  lastX = point.x;
  lastY = point.y;
  currentX = point.x;
  currentY = point.y;
  isDrawing = true;

  if (currentShape !== "select" && currentShape !== "fill") {
      saveHistory();
  }

  // [FIX: BITMAP-OBJECT SEPARATION] Hide objects when starting a bitmap tool
  if (isFreehandTool(currentShape)) {
      if (transformBaseSnapshot) ctx.putImageData(transformBaseSnapshot, 0, 0);
      else clearCanvas();
  }

  if (shouldPreviewShape(currentShape)) {
    previewSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
});

canvas.addEventListener("mousemove", (event) => {
  const point = getCanvasPoint(event);

  // [FIX: TRANSFORM UI] Change cursor when hovering over handles or selection
  if (!isDrawing && hasSelectionBox && selectedRegion) {
      const handle = hitTestHandles(point.x, point.y, selectedRegion);
      if (handle) {
          const handles = getHandlePositions(selectedRegion);
          canvas.style.cursor = handles[handle].cursor;
      } else if (point.x >= selectedRegion.x && point.x <= selectedRegion.x + selectedRegion.width &&
                 point.y >= selectedRegion.y && point.y <= selectedRegion.y + selectedRegion.height) {
          canvas.style.cursor = 'move';
      } else {
          canvas.style.cursor = 'crosshair';
      }
  }

  if (!isDrawing) return;

  // [FIX: SELECT] Only update coordinates if we are dragging the selection (marching ants redraws automatically)
  if (currentShape === "select" && isDraggingSelection) {
     const dx = point.x - (selectedRegion.x + dragOffsetX);
     const dy = point.y - (selectedRegion.y + dragOffsetY);

     // Update objects inside selection [FIX: OBJECT-BASED DRAG]
     const targets = getObjectsInSelection();
     targets.forEach(obj => {
         if (obj.type === 'line') {
             obj.x0 += dx; obj.y0 += dy;
             obj.x1 += dx; obj.y1 += dy;
         } else if (obj.type === 'circle' || obj.type === 'ellipse') {
             obj.cx += dx; obj.cy += dy;
         } else if (obj.type === 'polygon') {
             obj.vertices = translate(obj.vertices, dx, dy);
         }
     });

     selectedRegion.x += dx;
     selectedRegion.y += dy;
     
     renderAllObjects();
     return;
  }

  currentX = point.x;
  currentY = point.y;

  if (isFreehandTool(currentShape)) {
    const color = colorPicker.value;
    const size = Number.parseInt(lineWidthInput.value, 10) || 1;

    if (currentShape === "pencil") {
      drawPencil(ctx, lastX, lastY, currentX, currentY, color, size);
    } else if (currentShape === "marker") {
      drawMarker(ctx, lastX, lastY, currentX, currentY, color, size * 2);
    } else if (currentShape === "airbrush") {
      drawAirbrush(ctx, currentX, currentY, color, size);
    }

    lastX = currentX;
    lastY = currentY;
  } else if (shouldPreviewShape(currentShape)) {
    schedulePreviewRender();
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (!isDrawing) return;
  isDrawing = false;
  isDrawingSelection = false; // [FIX: SELECT] Reset drawing state

  const point = getCanvasPoint(event);
  currentX = point.x;
  currentY = point.y;

  // [FIX: BITMAP-OBJECT SEPARATION] Capture background and restore objects
  if (isFreehandTool(currentShape)) {
      transformBaseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      renderAllObjects();
      return;
  }

  if (currentShape === "select" && isDraggingSelection) {
      isDraggingSelection = false;
      renderAllObjects();
      return;
  }

  if (shouldPreviewShape(currentShape)) {
    finalizeShape(currentX, currentY);
  }

  cancelPreview();
});

canvas.addEventListener("mouseleave", () => {
  if (!isDrawing) return;
  isDrawing = false;
  isDrawingSelection = false; // [FIX: SELECT] Reset state
  if (currentShape === "select" && isDraggingSelection) return;
  
  restorePreviewBase();
  cancelPreview();
});

// BUG 5: Fill implementation on Canvas Click
canvas.addEventListener('click', (e) => {
  if (currentShape === 'fill') {
    const fillMethod = fillSelect.value;
    if (fillMethod === 'None') return;

    saveHistory();

    const { x, y } = getCanvasPoint(e);
    const fillColor = hexToRgba(colorPicker.value);
    const fillColorCss = rgbaToCss(fillColor);

    // [FIX: BITMAP-OBJECT SEPARATION] Hide objects to fill ONLY the bitmap layer
    if (transformBaseSnapshot) ctx.putImageData(transformBaseSnapshot, 0, 0);
    else clearCanvas();

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (fillMethod === 'Flood Fill') {
      floodFill(imgData, canvas.width, canvas.height, x, y, fillColor);
      ctx.putImageData(imgData, 0, 0);
    } else if (fillMethod === 'Boundary Fill') {
      const boundaryColor = hexToRgba(lastStrokeColor);
      boundaryFill(imgData, canvas.width, canvas.height, x, y, fillColor, boundaryColor);
      ctx.putImageData(imgData, 0, 0);
    } else if (fillMethod === 'Scan Line') {
      if (lastVertices && lastVertices.length >= 3) {
        scanLineFill(ctx, lastVertices, fillColorCss);
      } else {
        showToast("Gambar shape poligon terlebih dahulu untuk metode Scan Line.");
      }
    } else if (fillMethod === 'Inside-Outside') {
      if (lastVertices && lastVertices.length >= 3) {
        insideOutsideFill(ctx, lastVertices, fillColorCss);
      } else {
        showToast("Gambar shape poligon terlebih dahulu untuk metode Inside-Outside.");
      }
    }

    // Capture new background and restore objects
    transformBaseSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    renderAllObjects();
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  saveHistory();
  clearCanvas();
  lastShapeBounds = null;
  lastVertices = [];
  lastShapeMetadata = null;
  transformBaseSnapshot = null;
  previewSnapshot = null;
  cancelPreview();
  applySelection();
});

// =============================================
// TRANSFORMASI [FIX: TRANSFORM]
// =============================================

function redrawFromVertices(vertices) {
  if (vertices.length === 0 && !lastShapeMetadata) return;
  
  // [FIX: BLACK FILL BUG] Gunakan save/restore dan clear area yang benar
  ctx.save();

  // restore background [FIX: NON-DESTRUCTIVE]
  if (transformBaseSnapshot) {
      ctx.putImageData(transformBaseSnapshot, 0, 0);
  } else {
      clearCanvas();
  }

  const lineWidth = Number.parseInt(lineWidthInput.value, 10) || 1;
  const color = lastStrokeColor;
  const rawStyle = lineStyleSelect ? lineStyleSelect.value.toLowerCase() : "solid";
  const lineStyle = rawStyle.replace(" ", "-");

  // Pastikan tidak ada fill warna hitam default
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.strokeStyle = color;

  // [FIX: PARAMETRIC REDRAW]
  if (lastShapeMetadata) {
      let pts = [];
      if (lastShapeMetadata.type === 'circle') {
          pts = getMidpointCircle(lastShapeMetadata.cx, lastShapeMetadata.cy, lastShapeMetadata.r, lineStyle);
      } else if (lastShapeMetadata.type === 'ellipse') {
          pts = getMidpointEllipse(lastShapeMetadata.cx, lastShapeMetadata.cy, lastShapeMetadata.rx, lastShapeMetadata.ry, lineStyle);
      }
      drawPoints(pts, color, lineWidth);
      ctx.restore();
      return;
  }

  // Fallback ke vector redraw untuk poligon/garis
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const p0 = vertices[i];
    const p1 = vertices[(i + 1) % n];
    const pts = getBresenhamPoints(Math.round(p0.x), Math.round(p0.y), Math.round(p1.x), Math.round(p1.y));
    drawPoints(pts, color, lineWidth);
  }

  ctx.restore();

  lastShapeBounds = {
    minX: Math.min(...vertices.map(v => v.x)),
    maxX: Math.max(...vertices.map(v => v.x)),
    minY: Math.min(...vertices.map(v => v.y)),
    maxY: Math.max(...vertices.map(v => v.y)),
  };
}

function getShapeCenter() {
  // [FIX: GROUP CENTER] Gunakan pusat area seleksi jika ada
  if (hasSelectionBox && selectedRegion) {
      return {
          x: selectedRegion.x + selectedRegion.width / 2,
          y: selectedRegion.y + selectedRegion.height / 2
      };
  }
  if (lastShapeMetadata) {
      return { x: lastShapeMetadata.cx, y: lastShapeMetadata.cy };
  }
  if (lastVertices.length === 0) return { x: canvas.width / 2, y: canvas.height / 2 };
  const xs = lastVertices.map(v => v.x);
  const ys = lastVertices.map(v => v.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

// Guard untuk memastikan shape ada sebelum apply transformasi
function checkTransformGuard() {
    if (!lastVertices.length && !hasSelectionBox && !lastShapeMetadata) {
        showToast("Gambar shape atau pilih area terlebih dahulu");
        return false;
    }
    return true;
}

// === NEW TRANSFORM PANEL LOGIC ===

let currentTransformMode = 'translate';

const transformModeButtons = document.querySelectorAll('.transform-mode-btn');
const stepGroup = document.getElementById('stepGroup');
const dirGrid = document.getElementById('dirGrid');
const paramGroup = document.getElementById('paramGroup');
const applyTransformBtn = document.getElementById('applyTransformBtn');
const transformStepInput = document.getElementById('transformStep');

const modeParamConfig = {
  rotate: [
    { id: 'rotateAngle', label: 'Sudut (derajat)', type: 'number', default: 45, min: -360, max: 360 },
    { id: 'rotateCx',    label: 'Pusat X (px)',    type: 'number', default: 0 },
    { id: 'rotateCy',    label: 'Pusat Y (px)',    type: 'number', default: 0 },
  ],
  scale: [
    { id: 'scaleSx', label: 'Skala X (sx)', type: 'number', default: 1.5, step: 0.1 },
    { id: 'scaleSy', label: 'Skala Y (sy)', type: 'number', default: 1.5, step: 0.1 },
    { id: 'scaleCx', label: 'Pusat X (px)', type: 'number', default: 0 },
    { id: 'scaleCy', label: 'Pusat Y (px)', type: 'number', default: 0 },
  ],
  reflect: [
    {
      id: 'reflectAxis', label: 'Sumbu Refleksi', type: 'select',
      options: [
        { value: 'X',      label: 'Sumbu X (horizontal)' },
        { value: 'Y',      label: 'Sumbu Y (vertikal)' },
        { value: 'XY',     label: 'Sumbu X=Y (diagonal)' },
        { value: 'ORIGIN', label: 'Sumbu X=-Y' },
      ]
    }
  ],
  shear: [
    { id: 'shearShx', label: 'Shear X (shx)', type: 'number', default: 0.3, step: 0.1 },
    { id: 'shearShy', label: 'Shear Y (shy)', type: 'number', default: 0, step: 0.1 },
  ],
};

function renderParamGroup(mode) {
  paramGroup.innerHTML = '';
  const configs = modeParamConfig[mode];
  if (!configs) return;

  const center = getShapeCenter();

  configs.forEach(cfg => {
    const label = document.createElement('label');
    label.textContent = cfg.label;
    label.htmlFor = cfg.id;
    paramGroup.appendChild(label);

    if (cfg.type === 'select') {
      const select = document.createElement('select');
      select.id = cfg.id;
      select.style.cssText = 'padding:5px 8px;border:1px solid #bbb;border-radius:4px;font-size:13px;width:100%;box-sizing:border-box;';
      cfg.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
      });
      paramGroup.appendChild(select);
    } else {
      const input = document.createElement('input');
      input.type = 'number';
      input.id = cfg.id;
      
      // Smart defaults for center
      if (cfg.id === 'rotateCx' || cfg.id === 'scaleCx') input.value = Math.round(center.x);
      else if (cfg.id === 'rotateCy' || cfg.id === 'scaleCy') input.value = Math.round(center.y);
      else input.value = cfg.default ?? 0;
      
      if (cfg.min !== undefined) input.min = cfg.min;
      if (cfg.max !== undefined) input.max = cfg.max;
      if (cfg.step !== undefined) input.step = cfg.step;
      paramGroup.appendChild(input);
    }
  });
}

function switchTransformMode(mode) {
  currentTransformMode = mode;

  transformModeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'translate') {
    stepGroup.style.display = 'flex';
    dirGrid.style.display = 'grid';
    paramGroup.style.display = 'none';
    applyTransformBtn.style.display = 'none';
  } else {
    stepGroup.style.display = 'none';
    dirGrid.style.display = 'none';
    paramGroup.style.display = 'flex';
    applyTransformBtn.style.display = 'block';
    renderParamGroup(mode);
  }
}

transformModeButtons.forEach(btn => {
  btn.addEventListener('click', () => switchTransformMode(btn.dataset.mode));
});

// Hook into the main toggle button to initialize with current shape center
const toggleTransform = document.getElementById("toggleTransform");
const transformPopup = document.getElementById("transform-panel");

toggleTransform.addEventListener("click", () => {
    // [FIX: TRANSFORM] Validate if shape exists before showing the panel
    if (transformPopup.classList.contains("hidden")) {
        if (!checkTransformGuard()) return; // checkTransformGuard handles the Toast internally
        
        transformPopup.classList.remove("hidden");
        toggleTransform.classList.add("active");
        
        // Initialize dynamic params with the center of the current active shape
        if (currentTransformMode !== 'translate') {
            renderParamGroup(currentTransformMode);
        }
    } else {
        transformPopup.classList.add("hidden");
        toggleTransform.classList.remove("active");
    }
});

// Close popup if clicking outside
document.addEventListener("click", (e) => {
    if(!toggleTransform.contains(e.target) && !transformPopup.contains(e.target)) {
        if (!transformPopup.classList.contains("hidden")) {
            transformPopup.classList.add("hidden");
            toggleTransform.classList.remove("active");
        }
    }
});

document.querySelectorAll('.dir-btn:not(.center-dot)').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!checkTransformGuard()) return;

    const step = parseInt(transformStepInput.value) || 20;
    const dx = parseInt(btn.dataset.dx) * step;
    const dy = parseInt(btn.dataset.dy) * step;

    saveHistory();

    if (hasSelectionBox && selectedRegion) {
        // [FIX: OBJECT-BASED GROUP TRANSFORM]
        const selectedObjects = getObjectsInSelection();
        if (selectedObjects.length > 0) {
            selectedObjects.forEach(obj => {
                if (obj.type === 'line') {
                    obj.x0 += dx; obj.y0 += dy;
                    obj.x1 += dx; obj.y1 += dy;
                } else if (obj.type === 'circle' || obj.type === 'ellipse') {
                    obj.cx += dx; obj.cy += dy;
                } else if (obj.type === 'polygon') {
                    obj.vertices = translate(obj.vertices, dx, dy);
                }
            });
            // Geser juga bounding box seleksi agar tetap sinkron
            selectedRegion.x += dx;
            selectedRegion.y += dy;
            renderAllObjects();
        } else {
            showToast("Tidak ada objek di dalam area seleksi");
        }
    } else if (lastShapeMetadata) {
        // Parametric single object
        lastShapeMetadata.cx += dx;
        lastShapeMetadata.cy += dy;
        // Sync back to objects list if found
        const obj = objects.find(o => o.id === lastShapeMetadata.id);
        if (obj) { obj.cx = lastShapeMetadata.cx; obj.cy = lastShapeMetadata.cy; }
        renderAllObjects();
    } else if (lastVertices.length > 0) {
        // Vector single object
        lastVertices = translate(lastVertices, dx, dy);
        // Find and update in objects list
        const obj = objects.find(o => o.type === 'polygon' && o.vertices === lastVertices);
        if (obj) obj.vertices = lastVertices;
        renderAllObjects();
    }
    showToast("Translasi diterapkan");
  });
});

applyTransformBtn.addEventListener('click', () => {
  if (!checkTransformGuard()) return;

  const mode = currentTransformMode;
  const config = modeParamConfig[mode];
  
  saveHistory();

  // Ambil objek untuk ditransformasi
  let targets = [];
  if (hasSelectionBox && selectedRegion) {
      targets = getObjectsInSelection();
  } else {
      // Fallback ke objek terakhir yang digambar
      const lastObj = objects[objects.length - 1];
      if (lastObj) targets = [lastObj];
  }

  if (targets.length === 0) {
      showToast("Pilih objek terlebih dahulu");
      return;
  }

  const center = getShapeCenter(); // Pusat transformasi (bisa dicustom via UI nantinya)

  targets.forEach(obj => {
      switch (mode) {
          case 'rotate': {
              const angle = parseFloat(document.getElementById('rotateAngle').value) || 0;
              const cx = parseFloat(document.getElementById('rotateCx').value) ?? center.x;
              const cy = parseFloat(document.getElementById('rotateCy').value) ?? center.y;
              
              if (obj.type === 'circle' || obj.type === 'ellipse') {
                  if (angle % 90 !== 0) {
                      // Bake to polygon for slanted curves
                      obj.vertices = bakeCurveToVertices(obj, 
                          obj.type === 'circle' ? getMidpointCircle : getMidpointEllipse,
                          obj.lineStyle
                      );
                      obj.vertices = rotate(obj.vertices, angle, {x: cx, y: cy});
                      obj.type = 'polygon';
                  } else {
                      const res = rotate([{x: obj.cx, y: obj.cy}], angle, {x: cx, y: cy});
                      obj.cx = res[0].x; obj.cy = res[0].y;
                      if (obj.type === 'ellipse' && angle % 180 !== 0) {
                          const tmp = obj.rx; obj.rx = obj.ry; obj.ry = tmp;
                      }
                  }
              } else if (obj.type === 'line') {
                  const res = rotate([{x: obj.x0, y: obj.y0}, {x: obj.x1, y: obj.y1}], angle, {x: cx, y: cy});
                  obj.x0 = res[0].x; obj.y0 = res[1].y;
                  obj.x1 = res[1].x; obj.y1 = res[1].y;
              } else {
                  obj.vertices = rotate(obj.vertices, angle, {x: cx, y: cy});
              }
              break;
          }
          case 'scale': {
              const sx = parseFloat(document.getElementById('scaleSx').value) || 1;
              const sy = parseFloat(document.getElementById('scaleSy').value) || 1;
              const cx = parseFloat(document.getElementById('scaleCx').value) ?? center.x;
              const cy = parseFloat(document.getElementById('scaleCy').value) ?? center.y;

              if (obj.type === 'circle' || obj.type === 'ellipse') {
                  const res = scaleEllipse(obj, sx, sy, {x: cx, y: cy});
                  Object.assign(obj, res);
              } else if (obj.type === 'line') {
                  const res = scale([{x: obj.x0, y: obj.y0}, {x: obj.x1, y: obj.y1}], sx, sy, {x: cx, y: cy});
                  obj.x0 = res[0].x; obj.y0 = res[0].y;
                  obj.x1 = res[1].x; obj.y1 = res[1].y;
              } else {
                  obj.vertices = scale(obj.vertices, sx, sy, {x: cx, y: cy});
              }
              break;
          }
          case 'reflect': {
              const axis = document.getElementById('reflectAxis').value;
              if (obj.type === 'circle' || obj.type === 'ellipse') {
                  const res = reflectEllipse(obj, axis, center);
                  Object.assign(obj, res);
              } else if (obj.type === 'line') {
                  const res = reflect([{x: obj.x0, y: obj.y0}, {x: obj.x1, y: obj.y1}], axis);
                  obj.x0 = res[0].x; obj.y0 = res[0].y;
                  obj.x1 = res[1].x; obj.y1 = res[1].y;
              } else {
                  obj.vertices = reflect(obj.vertices, axis);
              }
              break;
          }
          case 'shear': {
              const shx = parseFloat(document.getElementById('shearShx').value) || 0;
              const shy = parseFloat(document.getElementById('shearShy').value) || 0;

              if (obj.type === 'circle' || obj.type === 'ellipse') {
                  obj.vertices = bakeCurveToVertices(obj, 
                      obj.type === 'circle' ? getMidpointCircle : getMidpointEllipse,
                      obj.lineStyle
                  );
                  obj.vertices = shear(obj.vertices, shx, shy);
                  obj.type = 'polygon';
              } else if (obj.type === 'line') {
                  const res = shear([{x: obj.x0, y: obj.y0}, {x: obj.x1, y: obj.y1}], shx, shy);
                  obj.x0 = res[0].x; obj.y0 = res[0].y;
                  obj.x1 = res[1].x; obj.y1 = res[1].y;
              } else {
                  obj.vertices = shear(obj.vertices, shx, shy);
              }
              break;
          }
      }
  });

  renderAllObjects();
  showToast(`${mode.charAt(0).toUpperCase() + mode.slice(1)} diterapkan`);
});

switchTransformMode('translate');

setActiveShape(currentShape);
