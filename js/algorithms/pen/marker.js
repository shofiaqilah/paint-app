import { getBresenhamPoints } from "../bresenham_line.js";
import { hexToRgba, rgbaToCss } from "../warna/helper.js";

/**
 * Menggambar dengan gaya marker (semi-transparan).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x0 
 * @param {number} y0 
 * @param {number} x1 
 * @param {number} y1 
 * @param {string} hexColor 
 * @param {number} size 
 */
export function drawMarker(ctx, x0, y0, x1, y1, hexColor, size) {
  const points = getBresenhamPoints(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1));
  const rgba = hexToRgba(hexColor);
  
  // Set opacity marker (misal 40%)
  rgba.a = 0.4 * 255; 
  ctx.fillStyle = rgbaToCss(rgba);
  
  const offset = Math.floor(size / 2);
  for (const p of points) {
    ctx.fillRect(p.x - offset, p.y - offset, size, size);
  }
}
