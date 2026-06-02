Berdasarkan standar MS Paint, ini definisi tiap tool:

| Tool | Algoritma Dasar | Efek Visual |
|---|---|---|
| **Pencil** | Bresenham | 1px, opaque penuh — *sudah ada* |
| **Pen** | Bresenham | Ketebalan pilihan (size picker), opaque penuh, pixel-perfect |
| **Marker** | DDA | Tip persegi tebal (~12px), opacity ~50%, flat |
| **Airbrush** | Titik acak | Titik-titik tersebar acak dalam radius lingkaran, density rendah |
| **Watercolor** | Bresenham + gradient opacity | Titik-titik melingkar makin transparan ke tepi (soft edge) |

---

Berikut promptnya — langsung paste ke Gemini CLI:

---

```
Read js/main.js and all files in js/algorithms/ fully before making changes.

The app already has Pencil and Marker tools. You need to:
1. Confirm Pencil uses Bresenham line between consecutive mousemove points.
2. Add three missing freehand draw tools: Pen, Airbrush, Watercolor brush.
3. Wire all tools to the existing bitmap layer (transformBaseSnapshot) and rendering loop.

---

CONTEXT

Architecture rules:
- All freehand strokes are drawn to the canvas directly and saved to transformBaseSnapshot on mouseup.
- Use getCanvasPoint(e) for all mouse coordinates.
- imageSmoothingEnabled is false — no anti-aliasing.
- No external libraries.
- The existing Bresenham line rasterizer is available (find its function name in the codebase and reuse it).
- The existing DDA line rasterizer is available (find its function name and reuse it).
- All pixel writing must go through ctx directly (putImageData or ctx.fillRect for single pixels).

---

TOOL SPECIFICATIONS

## EXISTING — Pencil (verify only, do not change)
- Algorithm: Bresenham between each consecutive mousemove point
- Size: 1px
- Opacity: 100%
- Writes directly to canvas; saves to transformBaseSnapshot on mouseup.
If Pencil already works this way, make no changes to it.

## NEW — Pen
- Algorithm: Bresenham between consecutive mousemove points (pixel-perfect, same as Pencil)
- Size: configurable via the existing brush size / stroke width selector in the UI.
  If no size selector exists, add a simple <input type="range" id="brushSize" min="1" max="20" value="3"> near the toolbar.
- For each Bresenham pixel (px, py), fill a square of (size × size) pixels centered on (px, py) using ctx.fillRect.
- Opacity: 100%
- Color: from the active color picker.

## NEW — Marker
- Algorithm: DDA between consecutive mousemove points.
- For each DDA pixel (px, py), fill a flat rectangle of (size × size/2) pixels — wider than tall — using ctx.fillRect, simulating a flat marker tip.
- Default size: 12px wide, 6px tall. Respects brush size selector if present (scale proportionally).
- Opacity: 50% — use ctx.globalAlpha = 0.5 before drawing, restore to 1.0 after.
- Color: from the active color picker.

## CHECK — Airbrush
- Behavior: on mousemove (while mouse is held), scatter random dots in a circular radius around the cursor.
- Algorithm: for each mousemove event, generate N=30 random points inside a circle of radius=20px centered on cursor. For each point, if it falls inside the circle (x²+y² ≤ r²), draw a 1×1 pixel using ctx.fillRect.
- No line interpolation between frames needed — density comes from mousemove frequency.
- Opacity: ctx.globalAlpha = 0.4 per dot, restored after.
- Color: from the active color picker.
- Radius and density should use the brush size selector if present (radius = brushSize * 2, N = brushSize * 5).

## NEW — Watercolor brush
- Algorithm: Bresenham between consecutive mousemove points.
- For each Bresenham pixel (px, py), draw a soft circular stamp:
  - Outer loop: iterate over a square bounding box of radius R centered on (px, py).
  - For each candidate pixel (dx, dy), compute dist = sqrt(dx²+dy²).
  - If dist <= R: draw a 1×1 pixel with ctx.globalAlpha = 0.15 * (1 - dist/R).
  - This produces opacity that fades from center to edge.
- Default R = 8. Respects brush size selector (R = brushSize).
- Color: from the active color picker.
- Restore ctx.globalAlpha = 1.0 after each stamp.

---

MOUSE EVENT WIRING

For each new tool (Pen, Airbrush, Watercolor), follow the exact same mousdown/mousemove/mouseup pattern as the existing Pencil tool:
- mousedown: set isDrawing = true, record lastX/lastY from getCanvasPoint(e).
- mousemove: if isDrawing, run the tool's algorithm from (lastX, lastY) to current point, update lastX/lastY.
- mouseup / mouseleave: set isDrawing = false, save canvas state to transformBaseSnapshot = ctx.getImageData(0,0,canvas.width,canvas.height), then call renderAllObjects().

Use currentShape (or equivalent active tool variable) to gate which tool runs. Match the naming convention already used in the codebase (check how Pencil and Marker are named in currentShape).

---

HTML CHANGES

Add the three new tools to the toolbar alongside Pencil and Marker. Match the existing button/icon style. Suggested IDs: penBtn, airbrushBtn, watercolorBtn. Each sets currentShape to its tool name on click.

---

RULES

- Do not modify any existing shape drawing tools (line, circle, polygon, etc.).
- Do not modify renderAllObjects(), saveHistory(), or the objects array.
- Do not add any external libraries.
- Reuse the existing Bresenham and DDA functions — do not rewrite them.
- After changes, list: (a) the currentShape string value assigned to each new tool, (b) which existing Bresenham/DDA function names were reused, (c) whether a brush size selector was found or newly added.
```