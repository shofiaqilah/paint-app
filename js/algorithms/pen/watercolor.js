import { getBresenhamPoints } from "../bresenham_line.js";
import { hexToRgba, rgbaToCss } from "../warna/helper.js";

/**
 * Menggambar dengan gaya watercolor (soft edges, gradient opacity).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x0 
 * @param {number} y0 
 * @param {number} x1 
 * @param {number} y1 
 * @param {string} hexColor 
 * @param {number} size 
 */
export function drawWatercolor(ctx, x0, y0, x1, y1, hexColor, size) {
  const points = getBresenhamPoints(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1));
  const rgba = hexToRgba(hexColor);
  const R = size; 

  for (const p of points) {
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= R) {
          ctx.save();
          ctx.globalAlpha = 0.15 * (1 - dist / R);
          ctx.fillStyle = rgbaToCss(rgba);
          ctx.fillRect(Math.round(p.x + dx), Math.round(p.y + dy), 1, 1);
          ctx.restore();
        }
      }
    }
  }
}
