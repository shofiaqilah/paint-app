// js/algorithms/bresenham_line.js

/**
 * Menghasilkan semua titik garis menggunakan algoritma Bresenham.
 * @param {number} x0 - Titik awal X
 * @param {number} y0 - Titik awal Y
 * @param {number} x1 - Titik akhir X
 * @param {number} y1 - Titik akhir Y
 * @returns {{ x: number, y: number }[]} Array titik-titik garis
 */
export function getBresenhamPoints(x0, y0, x1, y1) {
  let points = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) break;
    let e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return points;
}
