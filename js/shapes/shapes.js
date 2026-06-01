// js/shapes/shapes.js
// Menghasilkan titik-titik untuk bentuk geometri dasar
// menggunakan algoritma Bresenham untuk setiap sisi.

import { getBresenhamPoints } from "../algorithms/bresenham_line.js";

/**
 * Menggabungkan titik-titik dari beberapa segmen garis menjadi satu array.
 * @param {[number, number][]} vertices - Array pasangan [x, y] yang membentuk poligon
 * @returns {{ x: number, y: number }[]}
 */
function polygonPoints(vertices) {
  const points = [];
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = vertices[i];
    const [x1, y1] = vertices[(i + 1) % n];
    points.push(...getBresenhamPoints(x0, y0, x1, y1));
  }
  return points;
}

/**
 * Persegi — sisi sama panjang, ditentukan dari titik awal dan akhir drag.
 * Sisi diambil dari jarak terpendek agar tetap persegi.
 * @param {number} x0 - Titik awal X (pojok kiri atas)
 * @param {number} y0 - Titik awal Y (pojok kiri atas)
 * @param {number} x1 - Titik akhir X (drag)
 * @param {number} y1 - Titik akhir Y (drag)
 * @returns {{ x: number, y: number }[]}
 */
export function getSquarePoints(x0, y0, x1, y1) {
  const side = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0));
  const signX = x1 >= x0 ? 1 : -1;
  const signY = y1 >= y0 ? 1 : -1;
  const x2 = x0 + signX * side;
  const y2 = y0 + signY * side;

  return polygonPoints([
    [x0, y0],
    [x2, y0],
    [x2, y2],
    [x0, y2],
  ]);
}

/**
 * Persegi Panjang — ditentukan dari titik pojok kiri atas ke pojok kanan bawah.
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @returns {{ x: number, y: number }[]}
 */
export function getRectanglePoints(x0, y0, x1, y1) {
  return polygonPoints([
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ]);
}

/**
 * Segitiga — tipe segitiga ditentukan oleh parameter `triangleType`:
 *   - 'right'      : segitiga siku-siku (default), titik siku di pojok kiri bawah
 *   - 'isosceles'  : segitiga sama kaki, puncak di tengah atas
 *   - 'equilateral': segitiga sama sisi (mendekati)
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {'right'|'isosceles'|'equilateral'} triangleType
 * @returns {{ x: number, y: number }[]}
 */
export function getTrianglePoints(x0, y0, x1, y1, triangleType = "equilateral") {
  switch (triangleType) {
    case "isosceles": {
      // Puncak di tengah atas, alas di bawah
      const midX = Math.round((x0 + x1) / 2);
      return polygonPoints([
        [midX, y0],
        [x1, y1],
        [x0, y1],
      ]);
    }
    case "equilateral": {
      // Alas horizontal, tinggi ≈ (√3/2) * lebar
      const base = Math.abs(x1 - x0);
      const height = Math.round((Math.sqrt(3) / 2) * base);
      const signY = y1 >= y0 ? 1 : -1;
      const midX = Math.round((x0 + x1) / 2);
      return polygonPoints([
        [x0, y0 + signY * height],
        [x1, y0 + signY * height],
        [midX, y0],
      ]);
    }
    case "right":
    default: {
      // Siku-siku: pojok siku di (x0, y1)
      return polygonPoints([
        [x0, y0],
        [x1, y1],
        [x0, y1],
      ]);
    }
  }
}
