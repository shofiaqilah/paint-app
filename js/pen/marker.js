import { getDdaPoints } from "../algorithms/dda_line.js";
import { hexToRgba, rgbaToCss } from "../algorithms/warna/helper.js";

/**
 * Menggambar dengan gaya marker (semi-transparan, tip datar).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x0 
 * @param {number} y0 
 * @param {number} x1 
 * @param {number} y1 
 * @param {string} hexColor 
 * @param {number} size 
 */
export function drawMarker(ctx, x0, y0, x1, y1, hexColor, size) {
  const points = getDdaPoints(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1));
  const rgba = hexToRgba(hexColor);
  
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = rgbaToCss(rgba);
  
  const width = size;
  const height = Math.max(1, Math.floor(size / 2));
  const offsetX = Math.floor(width / 2);
  const offsetY = Math.floor(height / 2);

  for (const p of points) {
    ctx.fillRect(p.x - offsetX, p.y - offsetY, width, height);
  }
  ctx.restore();
}
