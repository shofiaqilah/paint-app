import { getBresenhamPoints } from "../algorithms/bresenham_line.js";

/**
 * Menggambar dengan gaya pen (garis tegas dengan ketebalan).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x0 
 * @param {number} y0 
 * @param {number} x1 
 * @param {number} y1 
 * @param {string} color 
 * @param {number} size 
 */
export function drawPen(ctx, x0, y0, x1, y1, color, size) {
  const points = getBresenhamPoints(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1));
  ctx.fillStyle = color;
  const offset = Math.floor(size / 2);

  for (const p of points) {
    ctx.fillRect(p.x - offset, p.y - offset, size, size);
  }
}